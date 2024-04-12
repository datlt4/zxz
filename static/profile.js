const MIN_QUALIFIED_PASSWORD_STRENGTH = 4;
const MIN_PASSWORD_LENGTH = 8;
const RECOMMEND_PASSWORD_LENGTH = 16;
const QUALIFIED_PASSWORD_LENGTH = 20;

document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("current-password-change-pwd").addEventListener("blur", function(event) {
        validateField("current-password-change-pwd", "Please enter current password.", (input) => {
            return (input.value.length > 0) ? true : false;
        });
    });

    document.getElementById("new-password-change-pwd").addEventListener("blur", function(event) {
        validatePassword();
    });

    document.getElementById("confirm-password-change-pwd").addEventListener("blur", function(event) {
        validateField("confirm-password-change-pwd", "Password is not match.", (input) => {
            return ((input.value === document.getElementById("new-password-change-pwd").value) && (input.value.length > 0)) ? true : false;
        });
    });

    document.getElementById("edit-username").addEventListener("blur", function(event) {
        validateField("edit-username", "", (input) => {
            return (input.value.length > 0) ? true : false;
        });
    });

    // Get all radio buttons
    var radioButtons = document.querySelectorAll('input[name="method-archive-avatar"]');

    // Add event listener to each radio button
    radioButtons.forEach(function(radioButton) {
        radioButton.addEventListener('change', function() {
            // Check which radio button is selected
            if (radioButton.checked) {
                // Perform actions based on the selected radio button
                if (radioButton.id === 'method-archive-avatar-1') {
                    // Look Up Avatar by Email Address
                    document.getElementById("gavatar-input").disabled = false;
                    document.getElementById("avatar-input").disabled = true;
                } else if (radioButton.id === 'method-archive-avatar-2') {
                    // Use Custom Avatar
                    document.getElementById("avatar-input").disabled = false;
                    document.getElementById("gavatar-input").disabled = true;

                }
            }
        });
    });
    
    /* Accordion action */
    var accordions = document.querySelectorAll('.accordion-button');
    accordions.forEach(function(accordion) {
        accordion.addEventListener('click', function() {
            var collapseTarget = this.getAttribute('data-bs-target');
            var isExpanded = this.getAttribute('aria-expanded') === 'true';

            if (!isExpanded) {
                document.querySelector(collapseTarget).classList.add('show');
                this.classList.remove("collapsed");
                this.setAttribute('aria-expanded', 'true');
            } else {
                document.querySelector(collapseTarget).classList.remove('show');
                this.classList.add("collapsed");
                this.setAttribute('aria-expanded', 'false');
            }
        });
    });

    var passwordProfileInputGroups = document.querySelectorAll(".password-with-eye");
    passwordProfileInputGroups.forEach(function(passwordProfileInputGroup) {
        var passwordProfileInput = passwordProfileInputGroup.querySelector(".form-control");
        var showPasswordProfile = passwordProfileInputGroup.querySelector(".input-group-text");
        showPasswordProfile.addEventListener('click', function() {
            var type = passwordProfileInput.getAttribute('type') === 'password' ? 'input' : 'password';
            passwordProfileInput.setAttribute('type', type);
            showPasswordProfile.querySelector(".bi").className = type === 'password' ? 'bi bi-eye' : 'bi bi-eye-slash';
        });
    });
});

// category in [danger, info, warning, success]
function insertMessageIntoToast(header, text, category) {
    // Create a new toast element
    var toastElement = document.createElement('div');
    toastElement.classList.add('toast', 'mb-2');
    toastElement.setAttribute('role', 'alert');
    toastElement.setAttribute('aria-live', 'assertive');
    toastElement.setAttribute('aria-atomic', 'true');
    toastElement.setAttribute('data-bs-animation', 'true');

    // Create the toast header
    var toastHeader = document.createElement('div');
    toastHeader.classList.add('toast-header', category);
    toastHeader.innerHTML = `
        <strong class="me-auto">` +  header + `</strong>
        <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
    `;

    // Create the toast body
    var toastBody = document.createElement('div');
    toastBody.classList.add('toast-body', category);
    toastBody.textContent = text;

    // Append the header and body to the toast element
    toastElement.appendChild(toastHeader);
    toastElement.appendChild(toastBody);

    // Get the position-fixed div element
    var positionFixedDiv = document.querySelector('.position-fixed');

    // Append the toast element to the position-fixed div
    positionFixedDiv.appendChild(toastElement);

    // Initialize the toast
    var bsToast = new bootstrap.Toast(toastElement);

    // Show the toast
    bsToast.show();
    setTimeout(function() {bsToast.hide()}, 6660);

    toastElement.classList.add('toast', 'mb-2');
    var closeButton = toastElement.querySelector(".btn-close");
        closeButton.addEventListener("click", function(){
            toastElement.classList.remove("show");
    });
}

function checkPasswordStrength(current_password, password) {
    // Define criteria for password strength
    const hasNumber = /\d/;
    const hasUppercase = /[A-Z]/;
    const hasLowercase = /[a-z]/;
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;

    // Check password against criteria
    var message = "";
    var strength = 0;
    if (password.length === 0 ) {
        message = "Please enter a password.";
    } else if (password === current_password) {
        message = "The new password matches the old password. Please enter a completely new password";
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

function validateField(input_id, message="", f = (input) => { return input.value.length > 0; }) {
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
    let password = document.getElementById("new-password-change-pwd").value;
    let current_password = document.getElementById("current-password-change-pwd").value;
    let strength = checkPasswordStrength(current_password, password);
    if (strength.strength < MIN_QUALIFIED_PASSWORD_STRENGTH) {
        return validateField("new-password-change-pwd", strength.message, f = (input) => { return false; });
    } else {
        return validateField("new-password-change-pwd", "", f = (input) => { return true; });
    }
}

function submitChangePasswordForm() {
    var v1 = validateField("current-password-change-pwd", "Please enter current password.", (input) => {
        return (input.value.length > 0) ? true : false;
    });
    var v2 = validatePassword();
    var v3 = validateField("confirm-password-change-pwd", "Password is not match.", (input) => {
        return ((input.value === document.getElementById("new-password-change-pwd").value) && (input.value.length > 0)) ? true : false;
    });
    if (!(v1 && v2 && v3)) {
        return;
    }
    var submitButton = document.getElementById("update-password-btn");
    submitButton.disabled = true;
    // document.getElementById('change-password-form').submit();
    var form = document.getElementById('change-password-form');
    var formData = new FormData(form);
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "/change-password", true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState === XMLHttpRequest.DONE) {
            if (xhr.status === 200) {
                insertMessageIntoToast("Success", "Password was changed successfully", "success")
            } else if (xhr.status === 400) {
                insertMessageIntoToast("Error 400", "Old password is incorrect", "danger");
                validateField("current-password-change-pwd", "Current password is not correct.", (input) => { return false; });
            } else if (xhr.status === 401) {
                insertMessageIntoToast("Error 401", "401 Unauthorized", "danger");
            } else if (xhr.status === 404) {
                insertMessageIntoToast("Error 404", "404 Not Found", "danger");
            } else if (xhr.status === 411) {
                insertMessageIntoToast("Error 411", "411 Length Required", "danger");
            } else if (xhr.status === 413) {
                insertMessageIntoToast("Error 413", "413 Payload Too Large", "danger");
            } else if (xhr.status === 415) {
                insertMessageIntoToast("Error 415", "415 Unsupported Media Type", "danger");
            } else if (xhr.status === 451) {
                insertMessageIntoToast("Error 451", "451 Unavailable For Legal Reasons", "danger");
            } else if (xhr.status === 500) {
                insertMessageIntoToast("Error 500", "500 Internal Server Error", "danger");
            }  else {
                insertMessageIntoToast("ERROR CODE" + xhr.status, xhr.status, "danger");
            }
            submitButton.disabled = false;
        }
    };
    xhr.onerror = function() {
        // Handle error
        insertMessageIntoToast("Error occur", "xhr.onerror", "danger");
        submitButton.disabled = false;
    };
    xhr.send(formData);
}

function submitDeleteAccountForm() {
    var v1 = validateField("password-delete-account", "Please enter password.", (input) => {
        return (input.value.length > 0) ? true : false;
    });

    if (!v1) {
        return;
    }

    var submitButton = document.getElementById("delete-account-btn");
    submitButton.disabled = true;
    var form = document.getElementById('delete-account-form');
    var formData = new FormData(form);
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "/delete-account", true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState === XMLHttpRequest.DONE) {
            if (xhr.status === 200) {
                insertMessageIntoToast("Success", "Account was deleted. Redirect to home page in a sec", "success")
                setTimeout(function() { window.location.href = "/" }, 3330);
            } else if (xhr.status === 400) {
                insertMessageIntoToast("Error 400", "Old password is incorrect", "danger");
                validateField("password-delete-account", "Current password is not correct.", (input) => { return false; });
            } else if (xhr.status === 401) {
                insertMessageIntoToast("Error 401", "401 Unauthorized response status code indicates that the client request has not been completed because it lacks valid authentication credentials for the requested resource.", "danger");
            } else if (xhr.status === 403) {
                insertMessageIntoToast("Error 403", "403 Forbidden response status code indicates that the server understands the request but refuses to authorize it.", "danger");
            } else if (xhr.status === 404) {
                insertMessageIntoToast("Error 404", "404 Not Found", "danger");
            } else if (xhr.status === 411) {
                insertMessageIntoToast("Error 411", "411 Length Required", "danger");
            } else if (xhr.status === 413) {
                insertMessageIntoToast("Error 413", "413 Payload Too Large", "danger");
            } else if (xhr.status === 415) {
                insertMessageIntoToast("Error 415", "415 Unsupported Media Type", "danger");
            } else if (xhr.status === 451) {
                insertMessageIntoToast("Error 451", "451 Unavailable For Legal Reasons", "danger");
            } else if (xhr.status === 500) {
                insertMessageIntoToast("Error 500", "500 Internal Server Error", "danger");
            }  else {
                insertMessageIntoToast("ERROR CODE" + xhr.status, xhr.status, "danger");
            }
            submitButton.disabled = false;
        }
    };
    xhr.onerror = function() {
        // Handle error
        insertMessageIntoToast("Error occur", "xhr.onerror", "danger");
        submitButton.disabled = false;
    };
    xhr.send(formData);
}

function submitUpdateProfileForm() {
    var v1 = validateField("edit-username", f = (input) => {
        return (input.value.length > 0) ? true : false;
    });
    if (!v1) {
        return;
    }

    var submitButton = document.getElementById("update-profile-btn");
    submitButton.disabled = true;
    var form = document.getElementById('update-profile-form');
    var formData = new FormData(form);
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "/update-profile", true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState === XMLHttpRequest.DONE) {
            if (xhr.status === 200) {
                insertMessageIntoToast("Success", "Profile was updated.", "success")
                setTimeout(function() { window.location.href = "/profile" }, 3330);
            } else if (xhr.status === 401) {
                insertMessageIntoToast("Error 401", "401 Unauthorized response status code indicates that the client request has not been completed because it lacks valid authentication credentials for the requested resource.", "danger");
            } else if (xhr.status === 403) {
                insertMessageIntoToast("Error 403", "403 Forbidden response status code indicates that the server understands the request but refuses to authorize it.", "danger");
            } else if (xhr.status === 409) {
                insertMessageIntoToast("Error 409", "409 Conflict, Username was registered", "danger");
                validateField("edit-username", "Username was registered, try again with new one", (input) => { return false; });
            } else if (xhr.status === 500) {
                insertMessageIntoToast("Error 500", "500 Internal Server Error", "danger");
            }  else {
                insertMessageIntoToast("ERROR CODE" + xhr.status, xhr.status, "danger");
            }
            submitButton.disabled = false;
        }
    };
    xhr.onerror = function() {
        // Handle error
        insertMessageIntoToast("Error occur", "xhr.onerror", "danger");
        submitButton.disabled = false;
    };
    xhr.send(formData);
}


function submitUpdateAvatarForm() {
    window.location.href = '#';
}

function submitDeleteAvatarForm() {
    window.location.href = '#';
}
