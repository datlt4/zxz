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

function submitForm() {
    var spinnerElement = document.getElementById("spinner-submit");
    spinnerElement.style.display = "block";
    var submitButton = document.getElementById("submit-btn");
    submitButton.disabled = true;
    clearResponseText('response');
    var fileInput = document.getElementById("file");
    var file = fileInput.files[0];
    var secretInput = document.getElementById("secret");
    var secret = secretInput.value;

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
        if (xhr.readyState === XMLHttpRequest.DONE) {
            if (xhr.status === 200) {
                showResponse(xhr.responseText.trim(), xhr.status, 'response');
            } else if (xhr.status === 400) {
                showResponse("400 Bad request", xhr.status, 'response');
            } else if (xhr.status === 401) {
                showResponse("401 Unauthorized", xhr.status, 'response');
            } else if (xhr.status === 404) {
                showResponse("404 Not Found", xhr.status, 'response');
            } else if (xhr.status === 411) {
                showResponse("411 Length Required", xhr.status, 'response');
            } else if (xhr.status === 413) {
                showResponse("413 Payload Too Large", xhr.status, 'response');
            } else if (xhr.status === 451) {
                showResponse("451 Unavailable For Legal Reasons", xhr.status, 'response');
            } else {
                showResponse("ERROR " + xhr.status, xhr.status, 'response');
            }
        }
        spinnerElement.style.display = "none";
        submitButton.disabled = false;
    };
    xhr.send(formData);
}

function submitShortenUrl() {
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
        if (xhr.readyState === XMLHttpRequest.DONE) {
            if (xhr.status === 200) {
                showResponse(xhr.responseText.trim(), xhr.status, 'responseShortenUrl');
            } else if (xhr.status === 400) {
                showResponse("400 Bad request", xhr.status, 'responseShortenUrl');
            } else if (xhr.status === 401) {
                showResponse("401 Unauthorized", xhr.status, 'responseShortenUrl');
            } else if (xhr.status === 404) {
                showResponse("404 Not Found", xhr.status, 'responseShortenUrl');
            } else if (xhr.status === 411) {
                showResponse("411 Length Required", xhr.status, 'responseShortenUrl');
            } else if (xhr.status === 413) {
                showResponse("413 Payload Too Large", xhr.status, 'responseShortenUrl');
            } else if (xhr.status === 451) {
                showResponse("451 Unavailable For Legal Reasons", xhr.status, 'responseShortenUrl');
            } else {
                showResponse("ERROR " + xhr.status, xhr.status, 'responseShortenUrl');
            }
        }
        spinnerElement.style.display = "none";
        submitButton.disabled = false;
    };
    xhr.send(formData);
}

function clearResponseText(responseElementName) {
    var responseDiv = document.getElementById(responseElementName);
    responseDiv.style.display = "none";
    responseDiv.textContent = ""; // Clear the response text
    responseDiv.className = "";
}

function showResponse(text, statusCode, responseElementName) {
    // Request successful
    var responseDiv = document.getElementById(responseElementName);
    responseDiv.style.display = "block";
    var codeElement = document.createElement('code');
    // Set its text content to the trimmed response
    codeElement.textContent = text
    codeElement.className = "response-code";// + responseElementName;
    responseDiv.appendChild(codeElement);
    responseDiv.role = "alert";
    if (statusCode === 200) {
        responseDiv.className = "mt-3 alert alert-success d-flex justify-content-between align-items-center";
        codeElement.style.color = "#1c8556";
        addButtons(text, responseElementName);
    } else {
        responseDiv.className = "mt-3 alert alert-danger d-flex justify-content-between align-items-center";
        codeElement.style.color = "#dc3545";
    }
}

// Function to add buttons
function addButtons(text, responseElementName) {
    var buttonContainer = document.createElement("div");
    buttonContainer.className = "button-container";
    buttonContainer.id = "button-container-" + responseElementName
    var responseDiv = document.getElementById(responseElementName);
    responseDiv.appendChild(buttonContainer);
    addCopyButton(text, responseElementName);
    addUrlInNewTabButton(text, responseElementName);
    addScanQrCodeButton(text, responseElementName);
}

// Function to add a copy button
function addCopyButton(text, responseElementName) {
    var button = document.createElement("button");
    button.className = "btn btn-success ms-2";
    button.innerHTML  = '<i class="bi bi-copy"></i>';
    button.onclick = function () {copyToClipboard(text);};
    var buttonContainer = document.getElementById("button-container-" + responseElementName);
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

// Function to add a button access url in new tab
function addUrlInNewTabButton(url, responseElementName) {
    var button = document.createElement("button");
    button.className = "btn btn-info ms-2";
    button.innerHTML  = '<i class="bi bi-globe2"></i>';
    button.onclick = function () {openUrlInNewTab(url);};
    var buttonContainer = document.getElementById("button-container-" + responseElementName);
    buttonContainer.appendChild(button);
}

// Open the URL in a new tab
function openUrlInNewTab(url) {
    window.open(url, '_blank');
}

// Function to add a copy button
function addScanQrCodeButton(text, responseElementName) {
    var button = document.createElement("button");
    button.className = "btn btn-warning ms-2";
    button.innerHTML  = '<i class="bi bi-qr-code-scan"></i>';
    button.setAttribute("data-bs-toggle", "modal");
    button.setAttribute("data-bs-target", "#qrCodeModal-" + responseElementName);
    var buttonContainer = document.getElementById("button-container-" + responseElementName);
    buttonContainer.appendChild(button);
    generateQrCode(text, responseElementName);
}

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