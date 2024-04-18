const MIN_QUALIFIED_PASSWORD_STRENGTH = 4;
const MIN_PASSWORD_LENGTH = 8;
const RECOMMEND_PASSWORD_LENGTH = 16;
const QUALIFIED_PASSWORD_LENGTH = 20;

let email = "";
let username = "";

document.addEventListener("DOMContentLoaded", function () {
    let flashMessageEmail = document.getElementById('flash-message-email');
    if (flashMessageEmail) {
        email = flashMessageEmail.dataset.message
    }

    let flashMessageUsername = document.getElementById('flash-message-username');
    if (flashMessageUsername) {
        username = flashMessageUsername.dataset.message
    }

    var passwordSignupInputGroups = document.querySelectorAll(".password-with-eye");
    passwordSignupInputGroups.forEach(function (passwordSignupInputGroup) {
        var passwordSignupInput = passwordSignupInputGroup.querySelector(".form-control");
        var showPasswordSignup = passwordSignupInputGroup.querySelector(".input-group-text");
        showPasswordSignup.addEventListener('click', function () {
            var type = passwordSignupInput.getAttribute('type') === 'password' ? 'input' : 'password';
            passwordSignupInput.setAttribute('type', type);
            showPasswordSignup.querySelector(".bi").className = type === 'password' ? 'bi bi-eye' : 'bi bi-eye-slash';
        });
    });

    // Initialize Bootstrap tooltip
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl)
    })

    document.getElementById("password-reset").addEventListener("blur", function (event) {
        validatePassword();
    });

    document.getElementById("confirm-password-reset").addEventListener("blur", function (event) {
        validateField("confirm-password-reset", "Password is not match.", (input) => {
            return ((input.value === document.getElementById("password-reset").value) && (input.value.length > 0)) ? true : false;
        });
    });

});

function checkPasswordStrength(username, email, password) {
    // Define criteria for password strength
    const hasNumber = /\d/;
    const hasUppercase = /[A-Z]/;
    const hasLowercase = /[a-z]/;
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;

    // Check password against criteria
    var message = "";
    var strength = 0;
    if (password.length === 0) {
        message = "Please enter a password.";
    } else if (password === username) {
        message = "Your password should not match your username for security reasons. Please choose a different password.";
    } else if (password === email) {
        message = "Your password should not match your email address for security reasons. Please choose a different password.";
    } else {
        if (password.length >= MIN_PASSWORD_LENGTH) ++strength;
        if (password.length >= RECOMMEND_PASSWORD_LENGTH) strength += 2;
        if (password.length >= QUALIFIED_PASSWORD_LENGTH) ++strength;
        if (hasNumber.test(password)) ++strength;
        if (hasUppercase.test(password)) ++strength;
        if (hasLowercase.test(password)) ++strength;
        if (hasSpecialChar.test(password)) ++strength;
        if (strength < MIN_QUALIFIED_PASSWORD_STRENGTH) {
            message = "Password is too weak!"
        } else {
            message = "OK"
        }
    }
    // Return password strength level
    return { strength: strength, message: message };
}

function validateField(input_id, message = "", f = (input) => { return input.value.length > 0; }) {
    var input = document.getElementById(input_id);
    var feedback = document.getElementById(input_id + "-feedback");
    //input.value = input.value.trim();
    if (f(input)) {
        input.classList.remove("is-invalid"); // Remove 'is-invalid' class
        input.classList.add("is_valid");
        feedback.style.display = "none";
        return true;
    } else {
        input.classList.add("is-invalid"); // Apply 'is-invalid' class
        input.classList.remove("is_valid");
        feedback.style.display = "block";
        if (message !== "") {
            feedback.querySelector("#feedback-text").textContent = message;
        }
        return false;
    }
}

function validatePassword() {
    let password = document.getElementById("password-reset").value;
    let strength = checkPasswordStrength(username, email, password);
    if (strength.strength < MIN_QUALIFIED_PASSWORD_STRENGTH) {
        return validateField("password-reset", strength.message, f = (input) => { return false; });
    } else {
        return validateField("password-reset", "", f = (input) => { return true; });
    }
}

function submitSignupForm() {
    var v1 = validatePassword();
    var v2 = validateField("confirm-password-reset", "Password is not match.", (input) => {
        return ((input.value === document.getElementById("password-reset").value) && (input.value.length > 0)) ? true : false;
    });
    if (!(v1 && v2)) {
        return;
    }

    document.getElementById('reset-password-form').submit();
}
