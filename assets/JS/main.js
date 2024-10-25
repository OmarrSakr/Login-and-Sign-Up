"use strict";

// ^ HTML elements
const sign_up_btn = document.querySelector("#sign-up-btn");
const sign_in_btn = document.querySelector("#sign-in-btn");
const container = document.querySelector(".container");
const leftPanel = document.querySelector(".left-panel");
const rightPanel = document.querySelector(".right-panel");

const signInForm = document.querySelector(".sign-in-form");
const signUpForm = document.querySelector(".sign-up-form");

const loginBtn = document.querySelector(".sign-in-form button[type='submit']");
const signupBtn = document.querySelector(".sign-up-form button[type='submit']");
const errorMessages = document.querySelectorAll(".error-message");


//!global Variables
const usernameRegex = /^[a-zA-Z]{3,}([._]?[a-zA-Z]+)*$/;
const validEmailRegex = /^[a-zA-Z0-9._%+-]+@(gmail\.com|yahoo\.com|outlook\.com|hotmail\.com)$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[\W_])[A-Za-z\d\W_]{6,}$/;


// * Clear error messages
function clearErrors() {
    errorMessages.forEach((msg) => (msg.textContent = ""));
}

// * Clear all input fields in both forms
function clearInputs() {
    // Select all input fields in both sign-up and sign-in forms
    const allInputs = document.querySelectorAll(".sign-in-form input, .sign-up-form input");
    allInputs.forEach((input) => (input.value = ""));
}

function addInputListeners() {
    const usernameInput = signUpForm.querySelector("input[type='text']");
    const emailInput = signUpForm.querySelector("input[type='email']");
    const passwordInput = signUpForm.querySelector("input[type='password']");

    usernameInput.addEventListener("input", function () {
        if (usernameRegex.test(this.value.trim())) {
            signUpForm.querySelector(".username-error").textContent = "";
        }
    });

    emailInput.addEventListener("input", function () {
        if (validEmailRegex.test(this.value.trim())) {
            signUpForm.querySelector(".email-error").textContent = "";
        }
    });

    passwordInput.addEventListener("input", function () {
        if (passwordRegex.test(this.value.trim())) {
            signUpForm.querySelector(".password-error").textContent = "";
        }
    });
}
// * Call the function to add listeners
addInputListeners();

// * Function to handle sign-up process
signupBtn.addEventListener("click", function (e) {
    e.preventDefault();
    clearErrors();

    const username = signUpForm.querySelector("input[type='text']").value.trim();
    const email = signUpForm.querySelector("input[type='email']").value.trim();
    const password = signUpForm.querySelector("input[type='password']").value.trim();

    const savedEmail = localStorage.getItem("email");
    const savedUsername = localStorage.getItem("username");
    let isValid = true;

    // ^ Validation rules

    if (!username) {
        signUpForm.querySelector(".username-error").textContent = "*Username is required.";
        signUpForm.querySelector(".username-error").style.color = "red";
        isValid = false;
    } else if (!usernameRegex.test(username)) {
        signUpForm.querySelector(".username-error").textContent =
            "*Invalid username (At least 3 characters and No spaces).";
        signUpForm.querySelector(".username-error").style.color = "red";

        isValid = false;
    } else if (username === savedUsername) {
        signUpForm.querySelector(".username-error").textContent = "*Username already exists.";
        isValid = false;
    } else {
        signUpForm.querySelector(".username-error").textContent = "*Validated";
        signUpForm.querySelector(".username-error").style.color = "#4CAF50";
        isValid = true;
    }

    if (!email) {
        signUpForm.querySelector(".email-error").textContent = "*Email is required.";
        signUpForm.querySelector(".email-error").style.color = "red";
        isValid = false;
    } else if (!validEmailRegex.test(email)) {
        signUpForm.querySelector(".email-error").textContent = "*Invalid email address.";
        signUpForm.querySelector(".email-error").style.color = "red";
        isValid = false;
    } else if (email === savedEmail) {
        signUpForm.querySelector(".email-error").textContent = "*Email already exists.";
        isValid = false;
    } else {
        signUpForm.querySelector(".email-error").textContent = "*Validated";
        signUpForm.querySelector(".email-error").style.color = "#4CAF50";
        isValid = true;
    }


    if (!password) {
        signUpForm.querySelector(".password-error").textContent = "*Password is required.";
        signUpForm.querySelector(".password-error").style.color = "red";
        isValid = false;
    } else if (!passwordRegex.test(password)) {
        signUpForm.querySelector(".password-error").textContent =
            "*at least 6 characters, including uppercase, lowercase,and special character.";
        signUpForm.querySelector(".password-error").style.color = "red";
        isValid = false;
    } else {
        signUpForm.querySelector(".password-error").textContent = "*Validated";
        signUpForm.querySelector(".password-error").style.color = "#4CAF50";
        isValid = true;
    }

    if (isValid) {
        // Save user data to localStorage
        localStorage.setItem("username", username);
        localStorage.setItem("email", email);
        localStorage.setItem("password", password);
        clearInputs();
        clearErrors();

    }
});

// * Function to handle login process
loginBtn.addEventListener("click", function (e) {
    e.preventDefault();
    clearErrors();

    const username = signInForm.querySelector("input[type='text']").value.trim();
    const password = signInForm.querySelector("input[type='password']").value.trim();

    const savedUsername = localStorage.getItem("username");
    const savedPassword = localStorage.getItem("password");

    let isValid = true;

    if (!username) {
        signInForm.querySelector(".username-error").textContent = "*Username is required.";
        signInForm.querySelector(".username-error").style.color = "red";
        isValid = false;
    } else if (username !== savedUsername) {
        signInForm.querySelector(".username-error").textContent = "*Incorrect Username.";
        signInForm.querySelector(".username-error").style.color = "red";

        isValid = false;
    } else {
        signInForm.querySelector(".username-error").textContent = "*Validated";
        signInForm.querySelector(".username-error").style.color = "#4CAF50";
        isValid = true;
    }

    if (!password) {
        signInForm.querySelector(".password-error").textContent = "*Password is required.";
        signInForm.querySelector(".password-error").style.color = "red";
        isValid = false;
    } else if (password !== savedPassword) {
        signInForm.querySelector(".password-error").textContent = "*Incorrect Password.";
        signInForm.querySelector(".password-error").style.color = "red";
        isValid = false;
    } else {
        signInForm.querySelector(".password-error").textContent = "*Validated";
        signInForm.querySelector(".password-error").style.color = "#4CAF50";
        isValid = true;
    }

    if (isValid) {
        if (username === localStorage.getItem("username") && password === localStorage.getItem("password")) {
            clearInputs();
            clearErrors();
            window.location.href = "home.html";
        }


    }
});



// * Toggle between sign-up and sign-in modes
sign_up_btn.addEventListener("click", function () {
    clearErrors();
    clearInputs();
    container.classList.add("sign-up-mode");
    leftPanel.style.opacity = "0";
    leftPanel.style.pointerEvents = "none";
    rightPanel.style.opacity = "1";
    rightPanel.style.pointerEvents = "all";
    //save the mode Sign_in in local storage 
    localStorage.setItem("formMode", "signUp");
});

sign_in_btn.addEventListener("click", function () {
    clearErrors();
    clearInputs();
    container.classList.remove("sign-up-mode");
    leftPanel.style.opacity = "1";
    leftPanel.style.pointerEvents = "all";
    rightPanel.style.opacity = "0";
    rightPanel.style.pointerEvents = "none";
    //save the mode Sign_in in local storage 
    localStorage.setItem("formMode", "signIn");
});

window.addEventListener("load", function () {
    const savedMode = this.localStorage.getItem("formMode");
    if (savedMode === "signUp") {
        container.classList.add("sign-up-mode");
        leftPanel.style.opacity = "0";
        leftPanel.style.pointerEvents = "none";
        rightPanel.style.opacity = "1";
        rightPanel.style.pointerEvents = "all";

    }
    else {
        leftPanel.style.opacity = "1";
        leftPanel.style.pointerEvents = "all";
        rightPanel.style.opacity = "0";
        rightPanel.style.pointerEvents = "none";
    }
})
