document.addEventListener("DOMContentLoaded", function () {
    var flashMessageInvalidResetToken = document.getElementById('flash-message-invalid-reset-token');
    if (flashMessageInvalidResetToken) {
        // Now you can use 'category' and 'message' as needed
        insertMessageIntoToast("Invalid Token", flashMessageInvalidResetToken.dataset.message, "danger");
        document.getElementById("email-forgot-password").focus()
    }

    document.getElementById("email-forgot-password").addEventListener("blur", function (event) {
        let v1 = validateField("email-forgot-password", "Please enter your email address.", (input) => {
            return (input.value.length > 0) ? true : false;
        });
        if (!v1) return;

        let v2 = validateField("email-forgot-password", "Please enter valid email address.", (input) => {
            return (/^[\w. +-]+@[\w-]+\.[\w.-]+$/.test(input.value)) ? true : false;
        });
        if (!v2) return;

        let formData = new FormData()
        let input = document.getElementById("email-forgot-password");
        let feedback = document.getElementById("email-forgot-password-feedback");
        formData.append("email", input.value)
        if (v1 && v2) {
            fetch("/check-email", { method: "POST", body: formData })
                .then(response => {
                    if (response.ok) {
                        // If the response is successful, handle it here
                        input.classList.remove("is-invalid"); // Apply 'is-invalid' class
                        input.classList.add("is-valid");
                        feedback.style.display = "none";
                    } else {
                        // If the response is not successful, handle the error here
                        input.classList.add("is-invalid"); // Apply 'is-invalid' class
                        input.classList.remove("is-valid");
                        feedback.querySelector("#feedback-text").textContent = "Email address has not registered";
                        feedback.style.display = "block";
                        insertMessageIntoToast("Email check failed", "Email address has not registered", "danger")
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
});

function validateField(input_id, message = "", f = (input) => { return input.value.length > 0; }) {
    let input = document.getElementById(input_id);
    let feedback = document.getElementById(input_id + "-feedback");
    //input.value = input.value.trim();
    if (f(input)) {
        input.classList.remove("is-invalid"); // Remove 'is-invalid' class
        input.classList.add("is-valid");
        feedback.style.display = "none";
        return true;
    } else {
        input.classList.add("is-invalid"); // Apply 'is-invalid' class
        input.classList.remove("is-valid");
        feedback.style.display = "block";
        if (message !== "") {
            feedback.querySelector("#feedback-text").textContent = message;
        }
        return false;
    }
}

function submitForm() {
    let v1 = validateField("email-forgot-password", "Please enter your email address.", (input) => {
        return ((input.value.length > 0) && (/^[\w. +-]+@[\w-]+\.[\w.-]+$/.test(input.value))) ? true : false;
    });
    if (!v1) {
        return;
    }

    document.getElementById('forgot-password-form').submit();
}
