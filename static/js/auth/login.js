document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("username-login").addEventListener("blur", function (event) {
        validateField("username-login", "Please enter your username or email.");
    });

    document.getElementById("password-login").addEventListener("blur", function (event) {
        validateField("password-login", "Please enter a password.");
    });

    // Handle flash message
    var flashMessageUserInfo = document.getElementById('flash-message-user_info');
    if (flashMessageUserInfo) {
        document.getElementById("username-login").value = flashMessageUserInfo.dataset.message;
    };

    if (document.getElementById('flash-message-unregistered')) {
        // Now you can use 'category' and 'message' as needed
        document.getElementById("username-login-feedback").style.display = "block";
        document.getElementById("username-login").classList.add("is-invalid"); // Apply 'is-invalid' class
        document.getElementById("username-login").focus();
        insertMessageIntoToast("Unregistered User", "Username or email address is not registered. Register and log in again.", "danger");
    }

    if (document.getElementById('flash-message-incorrect-password')) {
        // Now you can use 'category' and 'message' as needed
        document.getElementById("password-login-feedback").style.display = "block";
        document.getElementById("password-login").classList.add("is-invalid"); // Apply 'is-invalid' class
        document.getElementById("password-login").focus();
        insertMessageIntoToast("Incorrect Password", "Try to remember the passwordsignin and retry again", "danger");
    }

    let flashMessageMailSent = document.getElementById('flash-message-mail-sent');
    if (flashMessageMailSent) {
        // Now you can use 'category' and 'message' as needed
        insertMessageIntoToast("Mail sent", flashMessageMailSent.dataset.message, "success");
    }

    let flashMessageUnloggedIn = document.getElementById('flash-message-unlogged-in')
    if (flashMessageUnloggedIn) {
        // Now you can use 'category' and 'message' as needed
        insertMessageIntoToast("Not Logged In", flashMessageUnloggedIn.dataset.message, "warning");
    }

    let flashMessageInvalidResetToken = document.getElementById('flash-message-invalid-reset-token');
    if (document.getElementById('flash-message-invalid-reset-token')) {
        // Now you can use 'category' and 'message' as needed
        insertMessageIntoToast("Invalid Token", flashMessageInvalidResetToken.dataset.message, "danger");
    }

    let flashMessageFillEmail = document.getElementById('flash-message-fill-email')
    if (flashMessageFillEmail) {
        // Now you can use 'category' and 'message' as needed
        document.getElementById("username-login").value = flashMessageFillEmail.dataset.message;
        document.getElementById("password-login").focus();
    }

    let flashMessageRemember = document.getElementById('flash-message-remember')
    if (flashMessageRemember) {
        // Now you can use 'category' and 'message' as needed
        document.getElementById("remember-me").checked = (flashMessageRemember.dataset.message === "True") ? true : false;
    }

    let flashMessageSignupSuccessfully = document.getElementById('flash-message-signup-successfully')
    if (flashMessageSignupSuccessfully) {
        document.getElementById("username-login").value = flashMessageSignupSuccessfully.dataset.message;
        document.getElementById("password-login").focus();
        insertMessageIntoToast("Success", "Thank you for registering! Please activate your account via email before logging in.", "success");
    }

    let flashMessagePermissionDenied = document.getElementById('flash-message-permission-denied')
    if (flashMessagePermissionDenied) {
        document.getElementById("username-login").focus();
        insertMessageIntoToast("Permission Denied", "Cannot log in anonymous account", "danger");
    }

    let passwordLoginInputGroups = document.querySelectorAll(".password-with-eye");
    passwordLoginInputGroups.forEach(function (passwordLoginInputGroup) {
        let passwordLoginInput = passwordLoginInputGroup.querySelector(".form-control");
        let showPasswordLogin = passwordLoginInputGroup.querySelector(".input-group-text");
        showPasswordLogin.addEventListener('click', function () {
            let type = passwordLoginInput.getAttribute('type') === 'password' ? 'input' : 'password';
            passwordLoginInput.setAttribute('type', type);
            showPasswordLogin.querySelector(".bi").className = type === 'password' ? 'bi bi-eye' : 'bi bi-eye-slash';
        });
    });
});

function validateField(input_id, message = "") {
    let input = document.getElementById(input_id);
    let feedback = document.getElementById(input_id + "-feedback");
    // input.value = input.value.trim();
    if (input.value.length > 0) {
        input.classList.remove("is-invalid"); // Remove 'is-invalid' class
        input.classList.add("is_valid");
        feedback.style.display = "none";
        return true;
    } else {
        input.classList.add("is-invalid"); // Apply 'is-invalid' class
        input.classList.remove("is_valid");
        feedback.style.display = "block";
        if (message !== "") {
            // feedback.textContent = message;
            feedback.querySelector("#feedback-text").textContent = message;
        }
        return false;
    }
}

function submitLoginForm() {
    let v1 = validateField("username-login", "Please enter your username or email.");
    let v2 = validateField("password-login", "Please enter a password.");
    if (!(v1 && v2)) {
        return;
    }

    document.getElementById('login-form').submit();
}

function loginWithGoogle() {
    console.log("Sign In With Google");
}

function loginWithGithub() {
    console.log("Sign In With Github");
}
