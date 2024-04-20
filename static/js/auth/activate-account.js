document.addEventListener("DOMContentLoaded", function () {
    let flashMessageLoggedIn = document.getElementById('flash-message-logged-in');
    if (flashMessageLoggedIn) {
        // Now you can use 'category' and 'message' as needed
        insertMessageIntoToast("Logged In", flashMessageLoggedIn.dataset.message, "success");
    }

    let flashMessageInvalidActivateToken = document.getElementById('flash-message-invalid-activate-token');
    if (flashMessageInvalidActivateToken) {
        // Now you can use 'category' and 'message' as needed
        insertMessageIntoToast("Invalid Activate Token", flashMessageInvalidActivateToken.dataset.message, "danger");
    }

    let flashMessageAccountActivated = document.getElementById('flash-message-account-activated');
    if (flashMessageAccountActivated) {
        // Now you can use 'category' and 'message' as needed
        insertMessageIntoToast("Your accoun", flashMessageAccountActivated.dataset.message, "success");
    }

    let flashMessageNotActivated = document.getElementById('flash-message-not-activated');
    if (flashMessageNotActivated) {
        // Now you can use 'category' and 'message' as needed
        insertMessageIntoToast("Your account", flashMessageNotActivated.dataset.message, "danger");
    }

    let fetch_status = { e500: 0, e401: 0, network: 0, other: 0 };
    const TOAST_TIMEOUT = 16660;
    const CHECK_IS_CONFIRMED_INTERVAL = 5000;
    const NUMBER_RETRY_NOFIFY = 6;

    function reset_fetch_status(fetch_status) {
        for (let property in fetch_status)
            fetch_status[property] = 0;
        return fetch_status;
    }

    let check_is_confirmed_timer = setInterval(
        function () {
            fetch("/check-is-confirmed", { method: "POST" })
                .then(response => {
                    if (response.ok) {
                        return response.json();
                    } else {
                        switch (response.status) {
                            case 401:
                                // Handle 401 Unauthorized
                                if (!(fetch_status.e401 % NUMBER_RETRY_NOFIFY)) {
                                    fetch_status = reset_fetch_status(fetch_status);
                                    insertMessageIntoToast("401 Unauthorized", "Unauthorized", "danger", TOAST_TIMEOUT)
                                }
                                ++fetch_status.e401;
                                break;
                            case 500:
                                // Handle 500 Internal Server Error
                                if (!(fetch_status.e500 % NUMBER_RETRY_NOFIFY)) {
                                    fetch_status = reset_fetch_status(fetch_status);
                                    insertMessageIntoToast("500", "Internal Server Error", "danger", TOAST_TIMEOUT)
                                }
                                ++fetch_status.e500;
                                break;
                            default:
                                // Handle other status codes
                                if (!(fetch_status.other % NUMBER_RETRY_NOFIFY)) {
                                    fetch_status = reset_fetch_status(fetch_status);
                                    insertMessageIntoToast(response.status, "Other status codes", "danger", TOAST_TIMEOUT)
                                }
                                ++fetch_status.other;
                                break;
                        }
                    }
                })
                .then(data => {
                    if (data && data.confirmed) {
                        window.location.href = "/";
                    }
                })
                .catch(error => {
                    // Handle any network errors here
                    if (!(fetch_status.network % NUMBER_RETRY_NOFIFY)) {
                        fetch_status = reset_fetch_status(fetch_status);
                        insertMessageIntoToast("Network error", error, "danger", TOAST_TIMEOUT)
                    }
                    ++fetch_status.network;
                })
        }, CHECK_IS_CONFIRMED_INTERVAL
    );
});

function requestEmailToActivate() {
    fetch("/request-activate-account", { method: "POST" })
        .then(response => {
            if (response.ok) {
                insertMessageIntoToast("", "Activation email has sent successfully", "success")
            } else {
                insertMessageIntoToast("", "Got error when sent email", "danger")
            }
        })
}
