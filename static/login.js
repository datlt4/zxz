document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("username-login").addEventListener("blur", function(event) {
        validateField("username-login", "Please enter your username or email.");
    });

    document.getElementById("password-login").addEventListener("blur", function(event) {
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
    }

    if (document.getElementById('flash-message-incorrect-password')) {
        // Now you can use 'category' and 'message' as needed
        document.getElementById("password-login-feedback").style.display = "block";
        document.getElementById("password-login").classList.add("is-invalid"); // Apply 'is-invalid' class
        document.getElementById("password-login").focus();
    }

    var flashMessageRemember = document.getElementById('flash-message-remember')
    if (flashMessageRemember) {
        // Now you can use 'category' and 'message' as needed
        document.getElementById("remember-me").checked = (flashMessageRemember.dataset.message === "True") ? true : false;
    }

    var flashMessageSignupSuccessfully = document.getElementById('flash-message-signup-successfully')
    if (flashMessageSignupSuccessfully) {
        document.getElementById("username-login").value = flashMessageSignupSuccessfully.dataset.message;
        document.getElementById("password-login").focus();
        document.getElementById('success-toast').classList.add("show");
    }

    var flashMessagePermissionDenied = document.getElementById('flash-message-permission-denied')
    if (flashMessagePermissionDenied) {
        document.getElementById("username-login").focus();
        document.getElementById('perimission-denied-toast').classList.add("show");
    }

    // Hide the toast when the close button is clicked
    document.getElementById("close-success-toast").addEventListener('click', function() {
        document.getElementById('success-toast').classList.remove("show");
    });
    setTimeout(function() {document.getElementById('success-toast').classList.remove("show");}, 6660);

    document.getElementById("close-perimission-denied-toast").addEventListener('click', function() {
        document.getElementById('perimission-denied-toast').classList.remove("show");
    });
    setTimeout(function() {document.getElementById('perimission-denied-toast').classList.remove("show");}, 6660);
});

function validateField(input_id, message="") {
    var input = document.getElementById(input_id);
    var feedback = document.getElementById(input_id + "-feedback");
    // input.value = input.value.trim();
    if (input.value.length > 0) {
        input.classList.remove("is-invalid"); // Remove 'is-invalid' class
        feedback.style.display = "none";
        return true;
    } else {
        input.classList.add("is-invalid"); // Apply 'is-invalid' class
        feedback.style.display = "block";
        if (message !== "") {
            // feedback.textContent = message;
            feedback.querySelector("#feedback-text").textContent = message;
        }
        return false;
    }
}

function submitLoginForm() {
    var v1 = validateField("username-login", "Please enter your username or email.");
    var v2 = validateField("password-login", "Please enter a password.");
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
