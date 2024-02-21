document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("file").addEventListener("change", function(event) {
        // var selectedFile = event.target.files[0];
        validateFileSelection();
    });

    document.getElementById("shorten").addEventListener("change", function(event) {
        // var shortenUrl = event.target.value;
        validateShortenUrlInput()
    });

    $('[data-toggle="tooltip"]').tooltip();
    // Update the tooltip every second
    setInterval(function () {
        var codeElement = document.getElementById("response-code-response"); // "response-code-" + responseDivId;
        if (codeElement!==null) {
            if (codeElement.getAttribute("title") !== "Link is not available") {
                codeElement.setAttribute("title", formatTimeDifference(codeElement.getAttribute("data-x-expires")));
            }
        }
    }, 5000);
});

// Function to convert date to timestamp in milliseconds
function datetimeToTimestamp(dateString) {
    var date = new Date(dateString);
    return date.getTime();
}

function toggleSecret() {
    var secretInput = document.getElementById("secret");
    var enableSecretCheckbox = document.getElementById("enableSecret");
    secretInput.disabled = !enableSecretCheckbox.checked;
}

function toggleExpiration() {
    var expiresInput = document.getElementById('expires');
    var datetimeInput = document.getElementById('datetimepicker');
    var enableExpirationCheckbox = document.getElementById("enableExpiration");
    expiresInput.disabled = !enableExpirationCheckbox.checked;
    datetimeInput.disabled = !enableExpirationCheckbox.checked;
}

function validateFileSelection() {
    var fileInput = document.getElementById("file");
    var fileFeedback = document.getElementById("file-feedback");

    // Check if file is selected
    if (fileInput.files.length === 0) {
        fileInput.classList.add("is-invalid"); // Apply 'is-invalid' class
        fileFeedback.style.display = "block"; // Show the feedback message
        return false;
    } else {
        fileInput.classList.remove("is-invalid"); // Remove 'is-invalid' class
        fileFeedback.style.display = "none"; // Hide the feedback message
        return true;
    }
}

function submitForm() {
    if (!validateFileSelection()) {
        return;
    }
    var spinnerElement = document.getElementById("spinner-submit");
    spinnerElement.style.display = "block";
    var submitButton = document.getElementById("submit-btn");
    submitButton.disabled = true;
    clearResponseText('response');

    var expiresInput = document.getElementById('expires');
    var datetimeInput = document.getElementById('datetimepicker');
    var selectedDatetime = datetimeInput.value;
    var timestamp = datetimeToTimestamp(selectedDatetime);
    expiresInput.value = timestamp;

    var form = document.getElementById("fileUploadForm");
    var formData = new FormData(form);

    var xhr = new XMLHttpRequest();
    xhr.open("POST", "/");
    xhr.onreadystatechange = function() {
        checkHttpStatus(xhr, "response");
        spinnerElement.style.display = "none";
        submitButton.disabled = false;
    };
    xhr.send(formData);
}

function validateShortenUrlInput() {
    var shortenUrlInput = document.getElementById("shorten");
    var feedbackElement = document.getElementById("shorten-feedback");

    if (shortenUrlInput.value.trim() === "") {
        shortenUrlInput.classList.add("is-invalid"); // Apply 'is-invalid' class
        feedbackElement.style.display = "block";
        return false;
    } else {
        shortenUrlInput.classList.remove("is-invalid"); // Remove 'is-invalid' class
        feedbackElement.style.display = "none";
        return true;
    }
}

function submitShortenUrl() {
    if (!validateShortenUrlInput()) {
        return;
    }
    var spinnerElement = document.getElementById("spinner-submit-shorten-url");
    spinnerElement.style.display = "block";
    var submitButton = document.getElementById("submit-shorten-url-btn");
    submitButton.disabled = true;
    clearResponseText('responseShortenUrl');
    var form = document.getElementById("shortenUrlForm");
    var formData = new FormData(form);

    var xhr = new XMLHttpRequest();
    xhr.open("POST", "/");
    xhr.onreadystatechange = function() {
        checkHttpStatus(xhr, "responseShortenUrl");
        spinnerElement.style.display = "none";
        submitButton.disabled = false;
    };
    xhr.send(formData);
}

function clearResponseText(responseDivId) {
    if (validateFileSelection()) {    
        var responseDiv = document.getElementById(responseDivId);
        responseDiv.style.display = "none";
        responseDiv.textContent = ""; // Clear the response text
        responseDiv.className = "";
    }
}

function checkHttpStatus(xhr, responseDivId) {
    if (xhr.readyState === XMLHttpRequest.DONE) {
        if (xhr.status === 200) {
            showResponse(xhr.responseText.trim(), xhr.status, responseDivId, xhr);
        } else if (xhr.status === 400) {
            showResponse("400 Bad request", xhr.status, responseDivId, xhr);
        } else if (xhr.status === 401) {
            showResponse("401 Unauthorized", xhr.status, responseDivId, xhr);
        } else if (xhr.status === 404) {
            showResponse("404 Not Found", xhr.status, responseDivId, xhr);
        } else if (xhr.status === 411) {
            showResponse("411 Length Required", xhr.status, responseDivId, xhr);
        } else if (xhr.status === 413) {
            showResponse("413 Payload Too Large", xhr.status, responseDivId, xhr);
        } else if (xhr.status === 415) {
            showResponse("415 Unsupported Media Type", xhr.status, responseDivId, xhr);
        } else if (xhr.status === 451) {
            showResponse("451 Unavailable For Legal Reasons", xhr.status, responseDivId, xhr);
        } else {
            showResponse("ERROR CODE" + xhr.status, xhr.status, responseDivId, xhr);
        }
    }
}

function formatTimeDifference(timestamp) {
    var currentTime = Date.now();
    var timeDifference = timestamp - currentTime;
    var f = (timeDifference > 0) ? Math.floor : Math.ceil;

    var days = Math.floor(Math.abs(timeDifference) / 86400000);
    var hours = Math.floor((Math.abs(timeDifference) - days * 86400000) / 3600000);
    var minutes = Math.floor((Math.abs(timeDifference) - days * 86400000 - hours * 3600000) / 60000);

    var formattedTime = "";

    if (days > 0) {
        formattedTime += days + ((days===1) ? " day " : " days ");
    }
    if (hours > 0 || days > 0) {
        formattedTime += hours + ((hours===1) ? " hour " : " hours ");
    }
    formattedTime += minutes + ((minutes===1) ? " minute " : " minutes ");

    if (timeDifference < 0) {
        formattedTime = "Expired " + formattedTime + "ago, on " + (new Date(parseInt(timestamp)).toString());
    } else {
        formattedTime = "Will expire in  " + formattedTime + ", on " + (new Date(parseInt(timestamp)).toString());
    }

    return formattedTime.trim();
}

function showResponse(text, statusCode, responseDivId, xhr) {
    // Request successful
    var xTokenHeader = xhr.getResponseHeader('X-Token');
    var xExpiresHeader = xhr.getResponseHeader('X-Expires');
    var responseDiv = document.getElementById(responseDivId);
    responseDiv.style.display = "block";
    var codeElement = document.createElement('code');
    // Set its text content to the trimmed response
    codeElement.textContent = text
    codeElement.className = "response-code";// + responseDivId;
    codeElement.id = "response-code-" + responseDivId;
    if (xExpiresHeader!==null) {
        codeElement.setAttribute("data-bs-toggle", "tooltip");
        codeElement.setAttribute("data-bs-placement", "top");
        codeElement.setAttribute("title", formatTimeDifference(xExpiresHeader));
        codeElement.setAttribute("data-x-expires", xExpiresHeader);
    }
    responseDiv.appendChild(codeElement);
    responseDiv.role = "alert";
    if (statusCode === 200) {
        responseDiv.className = "mt-3 alert alert-success d-flex justify-content-between align-items-center";
        codeElement.style.color = "#1c8556";
        addButtons(text, responseDivId, xTokenHeader);
    } else {
        responseDiv.className = "mt-3 alert alert-danger d-flex justify-content-between align-items-center";
        codeElement.style.color = "#dc3545";
    }
}

// Function to remove buttons
function addRemoveButton(url, responseDivId, xTokenHeader) {
    var button = document.createElement("button");
    button.className = "btn btn-danger ms-2";
    button.id = "remote-button-" + responseDivId;
    button.innerHTML  = '<i class="bi bi-trash"></i>';
    button.onclick = function () {
        button.disabled = true;
        // Construct form data
        var formData = new FormData();
        formData.append('token', xTokenHeader);
        formData.append('delete', '');
        // Send POST request
        fetch(url, {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            alert('Delete request successful');
            button.className = "btn btn-secondary ms-2";
            var copyButton = document.getElementById("copy-button-" + responseDivId);
            console.log("copyButton:", copyButton);
            copyButton.className = "btn btn-secondary ms-2";
            copyButton.disabled = true;
            var urlInNewTabButton = document.getElementById("url-in-new-tab-button-" + responseDivId);
            console.log("urlInNewTabButton:", urlInNewTabButton);
            urlInNewTabButton.className = "btn btn-secondary ms-2";
            urlInNewTabButton.disabled = true;
            var scanQrCodeButton = document.getElementById("scan-qr-code-button-" + responseDivId);
            console.log("scanQrCodeButton:", scanQrCodeButton);
            scanQrCodeButton.className = "btn btn-secondary ms-2";
            scanQrCodeButton.disabled = true;
            var responseDiv = document.getElementById(responseDivId);
            console.log("responseDiv:", responseDiv);
            responseDiv.className = "mt-3 alert alert-secondary d-flex justify-content-between align-items-center";
            var codeElement = document.getElementById("response-code-" + responseDivId);
            console.log("codeElement:", codeElement);
            codeElement.style.textDecoration = "line-through";
            codeElement.style.color = "#41464b"
            codeElement.setAttribute("title", "Link is not available");
        })
        .catch(error => {
            alert('Error during delete request: ' + error);
            button.disabled = false;
        });
    };
    var buttonContainer = document.getElementById("button-container-" + responseDivId);
    buttonContainer.appendChild(button);
}

// Function to add buttons
function addButtons(text, responseDivId, xTokenHeader) {
    var buttonContainer = document.createElement("div");
    buttonContainer.className = "button-container";
    buttonContainer.id = "button-container-" + responseDivId
    var responseDiv = document.getElementById(responseDivId);
    responseDiv.appendChild(buttonContainer);
    addCopyButton(text, responseDivId);
    addUrlInNewTabButton(text, responseDivId);
    addScanQrCodeButton(text, responseDivId);
    if (xTokenHeader !== null) {
        addRemoveButton(text, responseDivId, xTokenHeader);
    }
}

// Function to add a copy button
function addCopyButton(text, responseDivId) {
    var button = document.createElement("button");
    button.className = "btn btn-success ms-2";
    button.innerHTML  = '<i class="bi bi-copy"></i>';
    button.id = "copy-button-" + responseDivId;
    button.onclick = function () {copyToClipboard(text);};
    var buttonContainer = document.getElementById("button-container-" + responseDivId);
    buttonContainer.appendChild(button);
}

// Function to copy text to clipboard
function copyToClipboard(text) {
    var textarea = document.createElement("textarea");
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
    alert("Copied to clipboard: " + text);
}

// Function to add a button that open url in new tab
function addUrlInNewTabButton(url, responseDivId) {
    var button = document.createElement("button");
    button.className = "btn btn-info ms-2";
    button.innerHTML  = '<i class="bi bi-globe2"></i>';
    button.id = "url-in-new-tab-button-" + responseDivId;
    button.onclick = function () {openUrlInNewTab(url);};
    var buttonContainer = document.getElementById("button-container-" + responseDivId);
    buttonContainer.appendChild(button);
}

// Open the URL in a new tab
function openUrlInNewTab(url) {
    window.open(url, '_blank');
}

// Function to add a copy button
function addScanQrCodeButton(text, responseDivId) {
    var button = document.createElement("button");
    button.className = "btn btn-warning ms-2";
    button.id = "scan-qr-code-button-" + responseDivId;
    button.innerHTML  = '<i class="bi bi-qr-code-scan"></i>';
    button.setAttribute("data-bs-toggle", "modal");
    button.setAttribute("data-bs-target", "#qrCodeModal-" + responseDivId);
    var buttonContainer = document.getElementById("button-container-" + responseDivId);
    buttonContainer.appendChild(button);
    generateQrCode(text, responseDivId);
}

// Function to generate Qr code that present reponse link
function generateQrCode(text, id) {
    var qrCodeContainer = document.getElementById("qrCodeContainer-" + id);
    qrCodeContainer.innerHTML = ""; // Clear previous QR code
    // Generate QR code
    var qr = new QRCode(qrCodeContainer, {
        text: text,
        width: 256,
        height: 256,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
    });
}
