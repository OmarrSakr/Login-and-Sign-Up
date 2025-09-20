
"use strict";

// ================== GLOBAL CONFIGURATION ==================
const CONFIG = {
    SALT: "smart_login_salt_2024",
    STORAGE_KEYS: {
        USERS: 'smart_login_users',
        SESSION: 'smart_login_session',
        FORM_MODE: 'formMode'
    }
};

// ================== UTILITY FUNCTIONS ==================

/**
 * Safe DOM element selection with error handling
 */
function safeQuerySelector(selector, parent = document) {
    try {
        const element = parent.querySelector(selector);
        if (!element) {
            console.warn(`Element not found: ${selector}`);
        }
        return element;
    } catch (error) {
        console.error(`Error selecting element: ${selector}`, error);
        return null;
    }
}

/**
 * Safe local storage operations
 */
const SafeStorage = {
    get(key, defaultValue = null) {
        try {
            const value = localStorage.getItem(key);
            return value ? JSON.parse(value) : defaultValue;
        } catch (error) {
            console.error(`Error reading from localStorage: ${key}`, error);
            return defaultValue;
        }
    },

    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error(`Error writing to localStorage: ${key}`, error);
            return false;
        }
    },

    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error(`Error removing from localStorage: ${key}`, error);
            return false;
        }
    }
};

/**
 * Enhanced notification system
 */
function showNotification(message, type = 'success', duration = 3000) {
    document.querySelectorAll('.custom-notification').forEach(n => n.remove());

    const notification = document.createElement('div');
    notification.className = `custom-notification ${type}`;
    notification.textContent = message;

    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '15px 25px',
        borderRadius: '12px',
        color: 'white',
        fontWeight: '600',
        zIndex: '10000',
        transform: 'translateX(400px)',
        transition: 'all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        fontFamily: '"Poppins", sans-serif',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        maxWidth: '320px',
        wordWrap: 'break-word',
        fontSize: '14px'
    });

    const colors = {
        success: '#2ed573',
        error: '#ff4757',
        info: '#4481eb',
        warning: '#ffa502'
    };

    notification.style.backgroundColor = colors[type] || colors.info;

    document.body.appendChild(notification);

    requestAnimationFrame(() => {
        notification.style.transform = 'translateX(0) scale(1)';
    });

    setTimeout(() => {
        notification.style.transform = 'translateX(400px) scale(0.8)';
        setTimeout(() => notification.remove(), 300);
    }, duration);

    return notification;
}

/**
 * Enhanced password hashing
 */
async function hashPassword(password) {
    try {
        const encoder = new TextEncoder();
        const data = encoder.encode(password + CONFIG.SALT);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (error) {
        console.error('Password hashing error:', error);
        throw new Error('Password hashing failed');
    }
}

/**
 * Enhanced loading state management
 */
function setButtonLoading(button, isLoading) {
    if (!button) return;

    if (isLoading) {
        button.disabled = true;
        button.setAttribute('data-original-text', button.textContent);
        button.innerHTML = '<i class="fa-solid fa-spinner fa-spin me-2"></i>Loading...';
        button.style.opacity = '0.8';
    } else {
        button.disabled = false;
        button.textContent = button.getAttribute('data-original-text') || 'Submit';
        button.style.opacity = '1';
    }
}

// ================== VALIDATION SYSTEM ==================

const PATTERNS = {
    username: /^[a-zA-Z\s]{2,}([._]?[a-zA-Z\s]+)*$/,
    email: /^[a-zA-Z0-9._%+-]+@(gmail\.com|yahoo\.com|outlook\.com|hotmail\.com)$/,
    password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*[\W_])[A-Za-z\d\W_]{6,}$/
};

const Validator = {
    username(value, isSignUp = false) {
        const trimmed = value.trim().replace(/\s+/g, ' ');

        if (!trimmed) return { isValid: false, message: "Username is required" };
        if (trimmed.length < 2) return { isValid: false, message: "Username too short (minimum 2 characters)" };
        if (!PATTERNS.username.test(trimmed)) return { isValid: false, message: "Username can only contain letters, spaces, dots, and underscores" };

        if (isSignUp && UserManager.findByUsername(trimmed)) {
            return { isValid: false, message: "Username already exists" };
        }

        return { isValid: true, message: "Valid username" };
    },

    email(value, isSignUp = false) {
        const trimmed = value.trim().toLowerCase();

        if (!trimmed) return { isValid: false, message: "Email is required" };
        if (!PATTERNS.email.test(trimmed)) return { isValid: false, message: "Please use Gmail, Yahoo, Outlook, or Hotmail" };

        if (isSignUp && UserManager.findByEmail(trimmed)) {
            return { isValid: false, message: "Email already registered" };
        }

        return { isValid: true, message: "Valid email" };
    },

    password(value) {
        if (!value) return { isValid: false, message: "Password is required" };
        if (!PATTERNS.password.test(value)) {
            return {
                isValid: false,
                message: "Password must be 6+ characters with uppercase, lowercase, and special character"
            };
        }

        return { isValid: true, message: "Strong password" };
    }
};

// ================== USER MANAGEMENT ==================

const UserManager = {
    getAll() {
        return SafeStorage.get(CONFIG.STORAGE_KEYS.USERS, []);
    },

    save(userData) {
        const users = this.getAll();
        const newUser = {
            ...userData,
            id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        return SafeStorage.set(CONFIG.STORAGE_KEYS.USERS, users) ? newUser : null;
    },

    findByUsername(username) {
        const users = this.getAll();
        const cleanUsername = username.trim().toLowerCase().replace(/\s+/g, ' ');
        return users.find(user =>
            user.username.toLowerCase().replace(/\s+/g, ' ') === cleanUsername
        );
    },

    findByEmail(email) {
        const users = this.getAll();
        return users.find(user => user.email.toLowerCase() === email.toLowerCase());
    },

    update(userId, updatedData) {
        const users = this.getAll();
        const userIndex = users.findIndex(user => user.id === userId);
        if (userIndex === -1) return false;

        users[userIndex] = { ...users[userIndex], ...updatedData };
        return SafeStorage.set(CONFIG.STORAGE_KEYS.USERS, users);
    }
};

// ================== SESSION MANAGEMENT ==================

const SessionManager = {
    save(user, rememberMe = false) {
        const sessionData = {
            userId: user.id,
            username: user.username,
            email: user.email,
            loginTime: new Date().toISOString(),
            rememberMe
        };

        try {
            if (rememberMe) {
                localStorage.setItem(CONFIG.STORAGE_KEYS.SESSION, JSON.stringify(sessionData));
                console.log('Session saved to localStorage:', sessionData);
            } else {
                sessionStorage.setItem(CONFIG.STORAGE_KEYS.SESSION, JSON.stringify(sessionData));
                console.log('Session saved to sessionStorage:', sessionData);
            }
            return true;
        } catch (error) {
            console.error('Session save error:', error);
            return false;
        }
    },

    get() {
        try {
            const session = localStorage.getItem(CONFIG.STORAGE_KEYS.SESSION) ||
                sessionStorage.getItem(CONFIG.STORAGE_KEYS.SESSION);
            const parsedSession = session ? JSON.parse(session) : null;
            console.log('Retrieved session:', parsedSession);
            return parsedSession;
        } catch (error) {
            console.error('Session get error:', error);
            return null;
        }
    },

    clear() {
        SafeStorage.remove(CONFIG.STORAGE_KEYS.SESSION);
        try {
            sessionStorage.removeItem(CONFIG.STORAGE_KEYS.SESSION);
        } catch (error) {
            console.error('Session clear error:', error);
        }
        SafeStorage.remove(CONFIG.STORAGE_KEYS.FORM_MODE);
        console.log('Session and form mode cleared');
    },

    isValid() {
        const session = this.get();
        return session && session.userId && session.username;
    }
};

// ================== UI MANAGEMENT ==================

const UIManager = {
    showError(element, message, inputElement = null) {
        if (!element) return;

        element.textContent = message;
        element.style.color = "#ff4757";

        if (inputElement) {
            const field = inputElement.closest('.input-field');
            if (field) {
                field.classList.remove('input-success');
                field.classList.add('input-error');
            }
        }
    },

    showSuccess(element, message, inputElement = null) {
        if (!element) return;

        element.textContent = message;
        element.style.color = "#2ed573";

        if (inputElement) {
            const field = inputElement.closest('.input-field');
            if (field) {
                field.classList.remove('input-error');
                field.classList.add('input-success');
            }
        }
    },

    clearErrors() {
        document.querySelectorAll(".error-message").forEach(msg => {
            msg.textContent = "";
            msg.style.color = "";
        });

        document.querySelectorAll('.input-field').forEach(field => {
            field.classList.remove('input-success', 'input-error');
        });
    },

    clearInputs() {
        const inputs = document.querySelectorAll("input[type='text'], input[type='email'], input[type='password']");
        inputs.forEach(input => {
            input.value = "";
            const field = input.closest('.input-field');
            if (field) {
                field.classList.remove('input-success', 'input-error');
            }
        });
    }
};

// ================== FORM HANDLERS ==================

const FormHandler = {
    async handleSignUp(e) {
        e.preventDefault();

        const form = safeQuerySelector('.sign-up-form');
        const submitBtn = safeQuerySelector('.sign-up-form button[type="submit"]');

        if (!form) {
            console.error('Sign up form not found');
            showNotification('Sign up form not found', 'error');
            return;
        }

        UIManager.clearErrors();
        setButtonLoading(submitBtn, true);

        try {
            const username = safeQuerySelector("input[type='text']", form)?.value.trim() || '';
            const email = safeQuerySelector("input[type='email']", form)?.value.trim() || '';
            const password = safeQuerySelector("input[type='password']", form)?.value || '';

            console.log('Sign up attempt:', { username, email });

            const validations = {
                username: Validator.username(username, true),
                email: Validator.email(email, true),
                password: Validator.password(password)
            };

            let hasErrors = false;

            Object.keys(validations).forEach(field => {
                const errorElement = safeQuerySelector(`.${field}-error`, form);
                const inputElement = safeQuerySelector(
                    field === 'username' ? "input[type='text']" :
                        field === 'email' ? "input[type='email']" :
                            "input[type='password']",
                    form
                );

                if (!validations[field].isValid) {
                    UIManager.showError(errorElement, validations[field].message, inputElement);
                    hasErrors = true;
                } else {
                    UIManager.showSuccess(errorElement, validations[field].message, inputElement);
                }
            });

            if (hasErrors) {
                showNotification('Please fix the errors above', 'error');
                return;
            }

            const hashedPassword = await hashPassword(password);
            const userData = {
                username: username.replace(/\s+/g, ' '),
                email: email.toLowerCase(),
                password: hashedPassword
            };

            const newUser = UserManager.save(userData);

            if (newUser) {
                showNotification(`Welcome ${userData.username}! Account created successfully.`, 'success', 4000);
                UIManager.clearInputs();
                UIManager.clearErrors();

                SafeStorage.remove(CONFIG.STORAGE_KEYS.FORM_MODE);
                setTimeout(() => {
                    FormHandler.switchToSignIn();
                    showNotification('You can now sign in with your credentials', 'info');
                }, 2000);
            } else {
                showNotification('Failed to create account. Please try again.', 'error');
            }

        } catch (error) {
            console.error('Sign up error:', error);
            showNotification('An unexpected error occurred. Please try again.', 'error');
        } finally {
            setButtonLoading(submitBtn, false);
        }
    },

    async handleSignIn(e) {
        e.preventDefault();

        const form = safeQuerySelector('.sign-in-form');
        const submitBtn = safeQuerySelector('.sign-in-form button[type="submit"]');

        if (!form) {
            console.error('Sign in form not found');
            showNotification('Sign in form not found', 'error');
            return;
        }

        UIManager.clearErrors();
        setButtonLoading(submitBtn, true);

        try {
            const username = safeQuerySelector("input[type='text']", form)?.value.trim() || '';
            const password = safeQuerySelector("input[type='password']", form)?.value || '';
            const rememberMe = safeQuerySelector("#remember-me")?.checked || false;

            console.log('Sign in attempt:', { username, rememberMe });

            if (!username || !password) {
                const usernameError = safeQuerySelector(".username-error", form);
                const passwordError = safeQuerySelector(".password-error", form);
                const usernameInput = safeQuerySelector("input[type='text']", form);
                const passwordInput = safeQuerySelector("input[type='password']", form);

                if (!username) {
                    UIManager.showError(usernameError, "Username is required", usernameInput);
                }
                if (!password) {
                    UIManager.showError(passwordError, "Password is required", passwordInput);
                }

                showNotification('Please fill in all required fields', 'error');
                return;
            }

            const user = UserManager.findByUsername(username);

            if (!user) {
                const usernameError = safeQuerySelector(".username-error", form);
                const usernameInput = safeQuerySelector("input[type='text']", form);
                UIManager.showError(usernameError, "Username not found", usernameInput);
                showNotification('Username not found. Please check your credentials.', 'error');
                return;
            }

            const hashedInputPassword = await hashPassword(password);

            if (hashedInputPassword !== user.password) {
                const passwordError = safeQuerySelector(".password-error", form);
                const passwordInput = safeQuerySelector("input[type='password']", form);
                UIManager.showError(passwordError, "Incorrect password", passwordInput);
                showNotification('Incorrect password. Please try again.', 'error');
                return;
            }

            if (SessionManager.save(user, rememberMe)) {
                showNotification(`Welcome back, ${user.username}!`, 'success');
                UIManager.clearInputs();
                UIManager.clearErrors();

                setTimeout(() => {
                    console.log('Redirecting to home.html');
                    window.location.href = "./home.html";
                }, 1500);
            } else {
                console.error('Session creation failed');
                showNotification('Session creation failed. Please try again.', 'error');
            }

        } catch (error) {
            console.error('Sign in error:', error);
            showNotification('An unexpected error occurred. Please try again.', 'error');
        } finally {
            setButtonLoading(submitBtn, false);
        }
    },

    switchToSignUp() {
        const container = safeQuerySelector(".container");
        const leftPanel = safeQuerySelector(".left-panel");
        const rightPanel = safeQuerySelector(".right-panel");

        console.log('Switching to sign-up mode');

        if (container) {
            UIManager.clearErrors();
            UIManager.clearInputs();
            container.classList.add("sign-up-mode");
        } else {
            console.error('Container not found for switchToSignUp');
        }

        if (leftPanel && rightPanel) {
            leftPanel.style.opacity = "0";
            leftPanel.style.pointerEvents = "none";
            rightPanel.style.opacity = "1";
            rightPanel.style.pointerEvents = "all";
        }

        SafeStorage.set(CONFIG.STORAGE_KEYS.FORM_MODE, "signUp");
    },

    switchToSignIn() {
        const container = safeQuerySelector(".container");
        const leftPanel = safeQuerySelector(".left-panel");
        const rightPanel = safeQuerySelector(".right-panel");

        console.log('Switching to sign-in mode');

        if (container) {
            UIManager.clearErrors();
            UIManager.clearInputs();
            container.classList.remove("sign-up-mode");
        } else {
            console.error('Container not found for switchToSignIn');
        }

        if (leftPanel && rightPanel) {
            leftPanel.style.opacity = "1";
            leftPanel.style.pointerEvents = "all";
            rightPanel.style.opacity = "0";
            rightPanel.style.pointerEvents = "none";
        }

        SafeStorage.set(CONFIG.STORAGE_KEYS.FORM_MODE, "signIn");
    }
};

// ================== PASSWORD VISIBILITY TOGGLE ==================

function togglePasswordVisibility(inputId, toggleElement) {
    const input = safeQuerySelector(`#${inputId}`);
    if (!input || !toggleElement) return;

    const icon = toggleElement.querySelector('i') || toggleElement;

    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
        toggleElement.title = 'Hide password';
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
        toggleElement.title = 'Show password';
    }
}

// ================== HOME PAGE FUNCTIONS ==================

let sessionTimer = null;

const HomePage = {
    formatDate(dateString) {
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    calculateDuration(startTime) {
        const diff = new Date() - new Date(startTime);
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    },

    updateSessionTimer(session) {
        if (!session) return;

        const duration = this.calculateDuration(session.loginTime);
        const sessionTimeElement = safeQuerySelector('#session-time');
        const sessionDurationElement = safeQuerySelector('#session-duration');

        if (sessionTimeElement) sessionTimeElement.textContent = `Session: ${duration}`;
        if (sessionDurationElement) sessionDurationElement.textContent = duration;
    },

    logout() {
        showNotification('Logging out...', 'success');
        setTimeout(() => {
            SessionManager.clear();
            if (sessionTimer) clearInterval(sessionTimer);
            window.location.href = "./index.html";
        }, 1000);
    },

    init() {
        const session = SessionManager.get();

        if (!session) {
            showNotification('Please log in to access this page', 'error');
            setTimeout(() => window.location.href = "./index.html", 2000);
            return;
        }

        console.log('Initializing home page with session:', session);

        const elements = {
            welcomeMessage: safeQuerySelector('#welcome-message'),
            welcomeSubtitle: safeQuerySelector('#welcome-subtitle'),
            navbarUsername: safeQuerySelector('#navbar-username'),
            loginTime: safeQuerySelector('#login-time'),
            userEmail: safeQuerySelector('#user-email')
        };

        if (elements.welcomeMessage) elements.welcomeMessage.textContent = `Welcome back, ${session.username}!`;
        if (elements.welcomeSubtitle) elements.welcomeSubtitle.textContent = `Great to see you again. Your account is active and secure.`;
        if (elements.navbarUsername) elements.navbarUsername.textContent = session.username;
        if (elements.loginTime) elements.loginTime.textContent = this.formatDate(session.loginTime);
        if (elements.userEmail) elements.userEmail.textContent = session.email;

        sessionTimer = setInterval(() => this.updateSessionTimer(session), 1000);

        const logoutButtons = ['#logout-btn', '#logout-btn-2'];
        logoutButtons.forEach(selector => {
            const btn = safeQuerySelector(selector);
            if (btn) {
                btn.replaceWith(btn.cloneNode(true));
                const newBtn = safeQuerySelector(selector);
                if (newBtn) newBtn.addEventListener('click', this.logout);
            }
        });

        setTimeout(() => showNotification(`Welcome back, ${session.username}!`, 'success'), 500);
    }
};

// Global functions for HTML onclick handlers
window.refreshSession = () => showNotification('Session refreshed!', 'success');
window.showUserInfo = () => {
    const session = SessionManager.get();
    if (session) showNotification(`User: ${session.username}\nEmail: ${session.email}\nLogin: ${HomePage.formatDate(session.loginTime)}`, 'info', 5000);
};
window.clearCache = () => showNotification('Cache cleared!', 'success');
window.showComingSoon = (feature) => showNotification(`${feature} feature coming soon!`, 'info');

// ================== APPLICATION INITIALIZATION ==================

function initializeApp() {
    try {
        if (window.location.pathname.includes('home.html') || safeQuerySelector('#welcome-message')) {
            HomePage.init();
            return;
        }

        const session = SessionManager.get();
        if (session && SessionManager.isValid()) {
            showNotification(`Welcome back, ${session.username}!`, 'success');
            setTimeout(() => window.location.href = "./home.html", 1000);
            return;
        }

        const container = safeQuerySelector(".container");
        if (!container) {
            console.error('Main container not found - may not be login page');
            return;
        }

        SafeStorage.remove(CONFIG.STORAGE_KEYS.FORM_MODE);
        FormHandler.switchToSignIn();

        const signUpBtn = safeQuerySelector("#sign-up-btn");
        const signInBtn = safeQuerySelector("#sign-in-btn");
        const signUpForm = safeQuerySelector(".sign-up-form");
        const signInForm = safeQuerySelector(".sign-in-form");

        if (signUpBtn) {
            signUpBtn.replaceWith(signUpBtn.cloneNode(true));
            const newSignUpBtn = safeQuerySelector("#sign-up-btn");
            if (newSignUpBtn) newSignUpBtn.addEventListener("click", () => FormHandler.switchToSignUp());
        }
        if (signInBtn) {
            signInBtn.replaceWith(signInBtn.cloneNode(true));
            const newSignInBtn = safeQuerySelector("#sign-in-btn");
            if (newSignInBtn) newSignInBtn.addEventListener("click", () => FormHandler.switchToSignIn());
        }
        if (signUpForm) signUpForm.addEventListener("submit", FormHandler.handleSignUp);
        if (signInForm) signInForm.addEventListener("submit", FormHandler.handleSignIn);

        console.log('Smart Login System initialized successfully');

    } catch (error) {
        console.error('Initialization error:', error);
        showNotification('System initialization failed. Please refresh the page.', 'error');
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

// Handle visibility changes for session timer
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        if (sessionTimer) clearInterval(sessionTimer);
    } else if (safeQuerySelector('#welcome-message')) {
        const session = SessionManager.get();
        if (session) sessionTimer = setInterval(() => HomePage.updateSessionTimer(session), 1000);
    }
});

// Initialize Bootstrap modals
const userProfileModal = new bootstrap.Modal(document.getElementById('userProfileModal'));
const editProfileModal = new bootstrap.Modal(document.getElementById('editProfileModal'));

// Function to show user profile modal
function showUserProfile() {
    const session = SessionManager.get();
    if (!session) {
        showNotification('No active session. Please log in.', 'error');
        setTimeout(() => window.location.href = './index.html', 1500);
        return;
    }

    console.log('Showing user profile with session:', session);

    const profileUsername = safeQuerySelector('#profile-username');
    const profileEmail = safeQuerySelector('#profile-email');

    if (profileUsername) profileUsername.textContent = session.username || 'User Name';
    if (profileEmail) profileEmail.textContent = session.email || 'user@example.com';
    userProfileModal.show();
}

// Function to show edit profile modal
function showEditProfile() {
    const session = SessionManager.get();
    if (!session) {
        showNotification('No active session. Please log in.', 'error');
        setTimeout(() => window.location.href = './index.html', 1500);
        return;
    }

    console.log('Showing edit profile with session:', session);

    const editUsername = safeQuerySelector('#editUsername');
    const editEmail = safeQuerySelector('#editEmail');

    if (editUsername) editUsername.value = session.username || '';
    if (editEmail) editEmail.value = session.email || '';
    editProfileModal.show();
}

// Function to toggle password visibility
function togglePasswordVisibility(inputId, icon) {
    const input = safeQuerySelector(`#${inputId}`);
    if (!input || !icon) return;

    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// Function to update profile
async function updateProfile() {
    const session = SessionManager.get();
    if (!session) {
        showNotification('No active session. Please log in.', 'error');
        setTimeout(() => window.location.href = './index.html', 1500);
        return;
    }

    const username = safeQuerySelector('#editUsername')?.value.trim();
    const email = safeQuerySelector('#editEmail')?.value.trim();
    const currentPassword = safeQuerySelector('#currentPassword')?.value || '';
    const newPassword = safeQuerySelector('#newPassword')?.value || '';

    console.log('Updating profile with:', { username, email, currentPassword, newPassword });

    // Validate inputs
    const validations = {
        username: Validator.username(username, true),
        email: Validator.email(email, true)
    };

    let hasErrors = false;

    if (!validations.username.isValid) {
        showNotification(validations.username.message, 'error');
        hasErrors = true;
    }
    if (!validations.email.isValid) {
        showNotification(validations.email.message, 'error');
        hasErrors = true;
    }

    // If user is changing password, verify current password and validate new password
    if (currentPassword || newPassword) {
        const user = UserManager.findByUsername(session.username);
        if (!user) {
            showNotification('User not found.', 'error');
            return;
        }

        const hashedCurrentPassword = await hashPassword(currentPassword);
        if (hashedCurrentPassword !== user.password) {
            showNotification('Current password is incorrect.', 'error');
            return;
        }

        if (newPassword) {
            const passwordValidation = Validator.password(newPassword);
            if (!passwordValidation.isValid) {
                showNotification(passwordValidation.message, 'error');
                return;
            }
        }
    }

    if (hasErrors) return;

    // Prepare updated data
    const updatedData = {
        username: username.replace(/\s+/g, ' '),
        email: email.toLowerCase()
    };

    if (newPassword) {
        updatedData.password = await hashPassword(newPassword);
    }

    // Update user data in storage
    if (UserManager.update(session.userId, updatedData)) {
        // Update session with new data
        const updatedSession = {
            ...session,
            username: updatedData.username,
            email: updatedData.email
        };
        SessionManager.save(updatedSession, session.rememberMe);

        // Update UI
        const navbarUsername = safeQuerySelector('#navbar-username');
        const welcomeMessage = safeQuerySelector('#welcome-message');
        const userEmail = safeQuerySelector('#user-email');

        if (navbarUsername) navbarUsername.textContent = updatedData.username;
        if (welcomeMessage) welcomeMessage.textContent = `Welcome back, ${updatedData.username}!`;
        if (userEmail) userEmail.textContent = updatedData.email;

        showNotification('Profile updated successfully!', 'success');
        editProfileModal.hide();
    } else {
        showNotification('Failed to update profile. Please try again.', 'error');
    }
}

// Function to reset edit profile form
function resetForm() {
    const session = SessionManager.get();
    if (session) {
        const editUsername = safeQuerySelector('#editUsername');
        const editEmail = safeQuerySelector('#editEmail');
        const currentPassword = safeQuerySelector('#currentPassword');
        const newPassword = safeQuerySelector('#newPassword');

        if (editUsername) editUsername.value = session.username || '';
        if (editEmail) editEmail.value = session.email || '';
        if (currentPassword) currentPassword.value = '';
        if (newPassword) newPassword.value = '';
    } else {
        const editProfileForm = safeQuerySelector('#editProfileForm');
        if (editProfileForm) editProfileForm.reset();
    }
}

// Placeholder for showComingSoon
function showComingSoon(feature) {
    showNotification(`${feature} feature coming soon!`, 'info');
}

// Placeholder for refreshSession
function refreshSession() {
    const session = SessionManager.get();
    if (session) {
        session.loginTime = new Date().toISOString();
        SessionManager.save(session, session.rememberMe);
        showNotification('Session refreshed!', 'success');
    } else {
        showNotification('No active session. Please log in.', 'error');
    }
}

// Placeholder for showUserInfo
function showUserInfo() {
    const session = SessionManager.get();
    if (session) {
        showNotification(`User: ${session.username}\nEmail: ${session.email}\nLogin: ${HomePage.formatDate(session.loginTime)}`, 'info', 5000);
    } else {
        showNotification('No active session. Please log in.', 'error');
    }
}

// Placeholder for clearCache
function clearCache() {
    SessionManager.clear();
    showNotification('Cache cleared! Logging out...', 'success');
    setTimeout(() => window.location.href = './index.html', 1500);
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('home.html') || safeQuerySelector('#welcome-message')) {
        // Use HomePage.init for home page initialization
        HomePage.init();
    }
});
