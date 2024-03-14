const MIN_QUALIFIED_PASSWORD_STRENGTH = 5;
const MIN_PASSWORD_LENGTH = 8;
const RECOMMEND_PASSWORD_LENGTH = 16;
const QUALIFIED_PASSWORD_LENGTH = 20;

document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("username-signup").addEventListener("blur", function(event) {
        validateField("username-signup", "Please enter new username.");
    });

    document.getElementById("email-signup").addEventListener("blur", function(event) {
        validateField("email-signup", "Please enter a valid email address.", (input) => {
            return ((input.value.length > 0) && (/^[\w. +-]+@[\w-]+\.[\w.-]+$/.test(input.value))) ? true : false;
        });
    });

    document.getElementById("password-signup").addEventListener("blur", function(event) {
        validatePassword();
    });

    document.getElementById("confirmation-password-signup").addEventListener("blur", function(event) {
        validateField("confirmation-password-signup", "Password is not match.", (input) => {
            return ((input.value === document.getElementById("password-signup").value) && (input.value.length > 0)) ? true : false;
        });
    });

    if (document.getElementById('flash-message-username-registered')) {
        document.getElementById("username-signup-feedback").style.display = "block";
        document.getElementById("username-signup").classList.add("is-invalid"); // Apply 'is-invalid' class
        document.getElementById("username-signup").focus();
    }

    if (document.getElementById('flash-message-email-registered')) {
        document.getElementById("email-signup-feedback").style.display = "block";
        document.getElementById("email-signup").classList.add("is-invalid"); // Apply 'is-invalid' class
        document.getElementById("email-signup").focus();
    }

    var flashMessageUsername = document.getElementById('flash-message-username');
    if (flashMessageUsername) {
        document.getElementById("username-signup").value = flashMessageUsername.dataset.message;
    }

    if (document.getElementById('flash-message-first-user')) {
        document.getElementById("alert-first-user").style.display = "block";
    }

    var passwordSignupInput = document.getElementById('password-signup');
    var showPasswordSignup = document.getElementById('show-password-signup');
    showPasswordSignup.addEventListener('click', function() {
        var type = passwordSignupInput.getAttribute('type') === 'password' ? 'input' : 'password';
        passwordSignupInput.setAttribute('type', type);
        showPasswordSignup.querySelector("#eye-icon").className = type === 'password' ? 'bi bi-eye' : 'bi bi-eye-slash';
    });

    var confirmationPasswordSignupInput = document.getElementById('confirmation-password-signup');
    var showConfirmationPasswordSignup = document.getElementById('show-confirmation-password-signup');
    showConfirmationPasswordSignup.addEventListener('click', function() {
        var type = confirmationPasswordSignupInput.getAttribute('type') === 'password' ? 'input' : 'password';
        confirmationPasswordSignupInput.setAttribute('type', type);
        showConfirmationPasswordSignup.querySelector("#eye-icon").className = type === 'password' ? 'bi bi-eye' : 'bi bi-eye-slash';
    });

    // Initialize Bootstrap tooltip
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl)
    })
});

function validateField(input_id, message="", f = (input) => { return input.value.length > 0; }) {
    var input = document.getElementById(input_id);
    var feedback = document.getElementById(input_id + "-feedback");
    //input.value = input.value.trim();
    if (f(input)) {
        input.classList.remove("is-invalid"); // Remove 'is-invalid' class
        feedback.style.display = "none";
        return true;
    } else {
        input.classList.add("is-invalid"); // Apply 'is-invalid' class
        feedback.style.display = "block";
        if (message !== "") {
            feedback.querySelector("#feedback-text").textContent = message;
        }
        return false;
    }
}

function validatePassword() {
    let username = document.getElementById("username-signup").value;
    let email = document.getElementById("email-signup").value;
    let password = document.getElementById("password-signup").value;
    let strength = checkPasswordStrength(username, email, password);
    if (strength.strength < MIN_QUALIFIED_PASSWORD_STRENGTH) {
        return validateField("password-signup", strength.message, f = (input) => { return false; });
    } else {
        return validateField("password-signup", "", f = (input) => { return true; });
    }
}

function submitSignupForm() {
    var v1 = validateField("username-signup", "Please enter new username.");
    var v2 = validateField("email-signup", "Please enter a valid email address.", (input) => {
                return ((input.value.length > 0) && (input.value.match(/^[\w. +-]+@[\w-]+\.[\w.-]+$/) ? true : false)) ? true : false;
            });
    var v3 = validatePassword();
    var v4 = validateField("confirmation-password-signup", "Password is not match.", (input) => {
        return ((input.value === document.getElementById("password-signup").value) && (input.value.length > 0)) ? true : false;
    });
    if (!(v1 && v2 && v3 && v4)) {
        return;
    }

    document.getElementById('signup-form').submit();
}

function checkPasswordStrength(username, email, password) {
    // Define criteria for password strength
    const minLength = 8;
    const recommendLength = 16;
    const qualifiedLength = 20;
    const hasNumber = /\d/;
    const hasUppercase = /[A-Z]/;
    const hasLowercase = /[a-z]/;
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;

    // Check password against criteria
    var message = "";
    var strength = 0;
    if (password.length === 0 ) {
        message = "Please enter a password.";
    } else if (password === username) {
        message = "Your password should not match your username for security reasons. Please choose a different password.";
    } else if (password === email) {
        message = "Your password should not match your email address for security reasons. Please choose a different password.";
    } else {
        if (password.length >= MIN_PASSWORD_LENGTH) ++strength;
        if (password.length >= RECOMMEND_PASSWORD_LENGTH) strength+=2;
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
    return {strength: strength, message: message};
}

function signupWithGoogle() {
    console.log("Sign Up With Google");
}

function signupWithGithub() {
    console.log("Sign Up With Github");
}
