const MIN_QUALIFIED_PASSWORD_STRENGTH = 4;
const MIN_PASSWORD_LENGTH = 8;
const RECOMMEND_PASSWORD_LENGTH = 16;
const QUALIFIED_PASSWORD_LENGTH = 20;

document.addEventListener("DOMContentLoaded", function () {
    var username_input = document.getElementById("username-signup")
    username_input.addEventListener("blur", function (event) {
        if (validateField("username-signup", "Please enter new username.")) {
            username_input.value = slugify(username_input.value);

            let v1 = checkFieldExist("username-signup", "/check-username", "username", (input, feedback) => {
                // If the response is not successful, handle the error here
                input.classList.add("is-invalid"); // Apply 'is-invalid' class
                input.classList.remove("is-valid");
                feedback.querySelector("#feedback-text").textContent = "Username has already registered";
                feedback.style.display = "block";
                insertMessageIntoToast("Username check failed", "Username has already registered", "danger")
            },  (input, feedback) => {
                // If the response is successful, handle it here
                input.classList.remove("is-invalid"); // Apply 'is-invalid' class
                input.classList.add("is-valid");
                feedback.style.display = "none";
            });

            console.log(v1)
            //let formData = new FormData();
            //let input = document.getElementById("username-signup");
            //let feedback = document.getElementById("username-signup-feedback");
            //formData.append("username", input.value);
            //fetch("/check-username", {method: "POST", body: formData})
            //    .then(response => {
            //        if (response.ok) {
            //            // If the response is not successful, handle the error here
            //            input.classList.add("is-invalid"); // Apply 'is-invalid' class
            //            input.classList.remove("is-valid");
            //            feedback.querySelector("#feedback-text").textContent = "Username has already registered";
            //            feedback.style.display = "block";
            //            insertMessageIntoToast("Username check failed", "Username has already registered", "danger")
            //        } else {
            //            // If the response is successful, handle it here
            //            input.classList.remove("is-invalid"); // Apply 'is-invalid' class
            //            input.classList.add("is-valid");
            //            feedback.style.display = "none";
            //        }
            //    })
            //    .catch(error => {
            //        // Handle any network errors here
            //        insertMessageIntoToast("Network error", error, "danger")
            //    });

        }
    });

    document.getElementById("email-signup").addEventListener("blur", function (event) {
        let v1 = validateField("email-signup", "Please enter your email address.", (input) => {
            return (input.value.length > 0) ? true : false;
        });
        if (!v1) return;

        let v2 = validateField("email-signup", "Please enter valid email address.", (input) => {
            return (/^[\w. +-]+@[\w-]+\.[\w.-]+$/.test(input.value)) ? true : false;
        });
        if (!v2) return;

        let formData = new FormData()
        let input = document.getElementById("email-signup");
        let feedback = document.getElementById("email-signup-feedback");
        formData.append("email", input.value)
        if (v1 && v2){
            fetch("/check-email", {method: "POST", body: formData})
                .then(response => {
                    if (response.ok) {
                        // If the response is not successful, handle the error here
                        input.classList.add("is-invalid"); // Apply 'is-invalid' class
                        input.classList.remove("is-valid");
                        feedback.querySelector("#feedback-text").textContent = "Email address has already registered";
                        feedback.style.display = "block";
                        insertMessageIntoToast("Email check failed", "Email address has already registered", "danger")
                    } else {
                        // If the response is successful, handle it here
                        input.classList.remove("is-invalid"); // Apply 'is-invalid' class
                        input.classList.add("is-valid");
                        feedback.style.display = "none";
                    }
                })
                .catch(error => {
                    // Handle any network errors here
                    insertMessageIntoToast("Network error", error, "danger")
                })
        } else {
            return;
        }
    });

    document.getElementById("password-signup").addEventListener("blur", function (event) {
        validatePassword();
    });

    document.getElementById("confirm-password-signup").addEventListener("blur", function (event) {
        validateField("confirm-password-signup", "Password is not match.", (input) => {
            return ((input.value === document.getElementById("password-signup").value) && (input.value.length > 0)) ? true : false;
        });
    });

    if (document.getElementById('flash-message-username-registered')) {
        document.getElementById("username-signup-feedback").style.display = "block";
        document.getElementById("username-signup").classList.add("is-invalid"); // Apply 'is-invalid' class
        document.getElementById("username-signup").focus();
        insertMessageIntoToast("Invalid Username", "Username existed. Input new one.", "danger");
    }

    if (document.getElementById('flash-message-email-registered')) {
        document.getElementById("email-signup-feedback").style.display = "block";
        document.getElementById("email-signup").classList.add("is-invalid"); // Apply 'is-invalid' class
        document.getElementById("email-signup").focus();
        insertMessageIntoToast("Invalid Email", "Email address was registered. Input new valid one", "danger");
    }

    var flashMessageUsername = document.getElementById('flash-message-username');
    if (flashMessageUsername) {
        document.getElementById("username-signup").value = flashMessageUsername.dataset.message;
    }

    var flashMessageEmail = document.getElementById('flash-message-email');
    if (flashMessageEmail) {
        document.getElementById("email-signup").value = flashMessageEmail.dataset.message;
    }

    if (document.getElementById('flash-message-first-user')) {
        document.getElementById("alert-first-user").style.display = "block";
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

    // Handle flash message
    var flashMessageEmail = document.getElementById('flash-message-email');
    if (flashMessageEmail) {
        document.getElementById("email-signup").value = flashMessageEmail.dataset.message;
    };

    var flashMessageUnregistered = document.getElementById('flash-message-unregistered');
    if (flashMessageUnregistered) {
        // Now you can use 'category' and 'message' as needed
        document.getElementById("email-signup-feedback").querySelector("#feedback-text").textContent = flashMessageUnregistered.dataset.message;
        document.getElementById("email-signup").classList.add("is-invalid"); // Apply 'is-invalid' class
        document.getElementById("email-signup").focus();
        insertMessageIntoToast("Unregistered User", flashMessageUnregistered.dataset.message, "danger");
    }
});

function slugify(str) {
    return str
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
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

function checkFieldExist(input_id, url_checking, data_field_name, ok_handker, failed_handler, network_error_handler = () => {insertMessageIntoToast("Network error", error, "danger")}) {
    let formData = new FormData();
    let input = document.getElementById(input_id);
    let feedback = document.getElementById(input_id + "-feedback");
    formData.append(data_field_name, input.value);
    let r;
    fetch(url_checking, {method: "POST", body: formData})
        .then(response => {
            if (response.ok) {
                ok_handker(input, feedback);
                r = true;
            } else {
                failed_handler(input, feedback);
                r = false;
            }
        })
        .catch(error => {
            // Handle any network errors here
            
        });

    return r;
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
    var v4 = validateField("confirm-password-signup", "Password is not match.", (input) => {
        return ((input.value === document.getElementById("password-signup").value) && (input.value.length > 0)) ? true : false;
    });
    if (!(v1 && v2 && v3 && v4)) {
        return;
    }

    document.getElementById('signup-form').submit();
}

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

function signupWithGoogle() {
    console.log("Sign Up With Google");
}

function signupWithGithub() {
    console.log("Sign Up With Github");
}
