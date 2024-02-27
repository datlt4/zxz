let checkmarkTimerMaxTime = Date.now();
let checkmarkCompleteTimer; // Define a global variable to hold the timer ID
let checkmarkSuccessTimer;
let hideCheckmarkTimer;
var editor;

$(document).ready(function () {
    editor = CodeMirror.fromTextArea(document.getElementById('text-editor'), {
       lineNumbers: true,
       mode: 'text',
       lineWrapping: true,
       indentUnit: 4,
       matchBrackets: true
    });
});

document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("file").addEventListener("change", function(event) {
        // var selectedFile = event.target.files[0];
        if (validateFileSelection()) {
            clearResponseDiv("response");
        }
    });

    document.getElementById("shorten").addEventListener("change", function(event) {
        // var shortenUrl = event.target.value;
        if (validateShortenUrlInput()) {
            clearResponseDiv("response-shorten-url");
        }
    });

    window.addEventListener("paste", event => {
        var isTextInput = event.target.tagName.toLowerCase() === 'input' || event.target.tagName.toLowerCase() === 'textarea';
        var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (isTextInput || (isMobile && !navigator.userAgent.match(/iPad|iPhone|iPod/i))) {
            return;
        }
        checkmarkTimerMaxTime = Date.now();
        clearTimeout(checkmarkCompleteTimer);
        clearTimeout(checkmarkSuccessTimer);
        clearTimeout(hideCheckmarkTimer);
        $("#check-pasting").attr("class", "check");
        $("#fill-pasting").attr("class", "fill");
        $("#path-pasting").attr("class", "path");
        var checkmarkElement = document.getElementById("checkmark-pasting");
        checkmarkElement.classList.remove("hide");
        checkmarkElement.classList.add("show");

        try {
            var webUploadSection = document.getElementById("web-upload");
            window.scrollTo({ top: webUploadSection.offsetTop, behavior: "smooth" /* Smooth scroll behavior */ });
            var fileInput = document.getElementById("file");
            // fileInput.files = event.clipboardData.files;
            // Check if the clipboard data contains files (images)
            if (event.clipboardData.files.length > 0) {
                fileInput.files = event.clipboardData.files;
            } else {
                // If no files are pasted, assume it's text and set the value of the file input
                // Note: This won't actually upload the text as a file, but it will set the value of the file input
                // You may need additional logic to handle text data differently, such as creating a Blob and assigning it to the file input
                var pastedText = event.clipboardData.getData("text/plain");
                if (pastedText !== "" && pastedText !== null) {
                    // If it's text, create a Blob containing the text
                    var blob = new Blob([pastedText], { type: "text/plain" });
                    // Create a new DataTransfer object
                    var dataTransfer = new DataTransfer();
                    // Add the blob as a file to the DataTransfer object
                    var file = new File([blob], "plaintext.txt", { type: "text/plain" });
                    dataTransfer.items.add(file);
                    // Assign the DataTransfer object to the files property
                    fileInput.files = dataTransfer.files;
                }
            }
            if (validateFileSelection()) {
                clearResponseDiv("response");
                checkmarkCompleteTimer = setTimeout(function (timestamp) {
                    $("#check-pasting").attr("class", "check check-complete");
                    $("#fill-pasting").attr("class", "fill fill-complete");
                }, 200, checkmarkTimerMaxTime);
                checkmarkSuccessTimer = setTimeout(function (timestamp) {
                    $("#check-pasting").attr("class", "check check-complete success");
                    $("#fill-pasting").attr("class", "fill fill-complete success");
                    $("#path-pasting").attr("class", "path path-complete");
                }, 500, checkmarkTimerMaxTime);
                hideCheckmarkTimer = setTimeout(function (timestamp) {
                    checkmarkElement.classList.remove("show");
                    checkmarkElement.classList.add("hide");
                }, 3500, checkmarkTimerMaxTime);
            }
        } catch (error) {
            checkmarkElement.classList.remove("show");
            checkmarkElement.classList.add("hide");
        }
    });

    $('[data-toggle="tooltip"]').tooltip();
    // Update the tooltip every minute
    setInterval(function () {
        var codeElement = document.getElementById("response-code-response"); // "response-code-" + responseDivId;
        if (codeElement!==null) {
            if (codeElement.getAttribute("title") !== "Link is not available") {
                codeElement.setAttribute("title", formatTimeDifference(codeElement.getAttribute("data-x-expires")));
            }
        }
    }, 5000);

    document.querySelector('a[href="#the-null-pointer"]').addEventListener("click", scrollIntoView);
    document.querySelector('a[href="#terms-of-service"]').addEventListener("click", scrollIntoView);
    document.querySelector('a[href="#web-upload"]').addEventListener("click", scrollIntoView);
    document.querySelector('a[href="#shorten-url"]').addEventListener("click", scrollIntoView);
    document.querySelector('a[href="#text-editor-sect"]').addEventListener("click", scrollIntoView);
    document.querySelector('a[href="#operator-notes"]').addEventListener("click", scrollIntoView);
    document.querySelector('a[href="#file-retention-period"]').addEventListener("click", scrollIntoView);
});

function scrollIntoView(event) {
    event.preventDefault(); // Prevent default anchor behavior
    // Get the target element by ID
    var targetId = event.currentTarget.getAttribute("href").substring(1);
    var targetSection = document.getElementById(targetId);
    if (targetSection) {
        // Calculate the offset position of the target element from the top of the page
        var offsetPosition = targetSection.offsetTop - ((targetId==="the-null-pointer") ? 60 : 0);
        // Scroll to the target element with the offset position
        window.scrollTo({
            top: offsetPosition,
            behavior: "smooth" // Smooth scroll behavior
        });
    }
}

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
        fileInput.style.borderColor = "#dc3545";
        fileFeedback.style.display = "block"; // Show the feedback message
        return false;
    } else {
        fileInput.classList.remove("is-invalid"); // Remove 'is-invalid' class
        fileInput.style.borderColor = "#d2d3d5";
        fileFeedback.style.display = "none"; // Hide the feedback message
        return true;
    }
}

let submitTimerMaxTime = Date.now();
let checkmarkSubmitCompleteTimer; // Define a global variable to hold the timer ID
let checkmarkSubmitSuccessTimer;
let hideCheckmarkSubmitTimer;

function submitForm() {
    if (!validateFileSelection()) {
        return;
    }
    submitTimerMaxTime = Date.now();
    clearTimeout(hideCheckmarkSubmitTimer);
    clearTimeout(checkmarkSubmitSuccessTimer);
    clearTimeout(checkmarkSubmitCompleteTimer);
    $("#check-submit").attr("class", "check");
    $("#fill-submit").attr("class", "fill");
    $("#path-submit").attr("class", "path");
    var checkmarkSubmitElement = document.getElementById("checkmark-submit");
    checkmarkSubmitElement.classList.remove("hide");
    checkmarkSubmitElement.classList.add("show");

    var submitButton = document.getElementById("submit-btn");
    submitButton.disabled = true;
    clearResponseDiv('response');

    var expiresInput = document.getElementById('expires');
    var datetimeInput = document.getElementById('datetimepicker');
    var selectedDatetime = datetimeInput.value;
    var timestamp = datetimeToTimestamp(selectedDatetime);
    expiresInput.value = timestamp;

    var form = document.getElementById("fileUploadForm");
    var formData = new FormData(form);

    var xhr = new XMLHttpRequest();
    xhr.open("POST", "/", true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState === XMLHttpRequest.DONE) {
            var checkHttp = checkHttpStatus(xhr, "response")
            if (checkHttp) {
                checkmarkSubmitCompleteTimer = setTimeout(function (timestamp, checkHttp) {
                    if ((timestamp < submitTimerMaxTime) || !checkHttp) {
                        return;
                    }
                    $("#check-submit").attr("class", "check check-complete");
                    $("#fill-submit").attr("class", "fill fill-complete");
                }, 100, Date.now(), checkHttp);
                checkmarkSubmitSuccessTimer = setTimeout(function (timestamp,checkHttp) {
                    if ((timestamp < submitTimerMaxTime) || !checkHttp) {
                        return;
                    }
                    $("#check-submit").attr("class", "check check-complete success");
                    $("#fill-submit").attr("class", "fill fill-complete success");
                    $("#path-submit").attr("class", "path path-complete");
                }, 300, Date.now(), checkHttp);
                hideCheckmarkSubmitTimer = setTimeout(function (timestamp,checkHttp) {
                    if ((timestamp < submitTimerMaxTime) || !checkHttp) {
                        return;
                    }
                    checkmarkSubmitElement.classList.remove("show");
                    checkmarkSubmitElement.classList.add("hide");
                }, 3500, Date.now(), checkHttp);
            } else {
                checkmarkSubmitElement.classList.remove("show");
                checkmarkSubmitElement.classList.add("hide");
            }
        }
        submitButton.disabled = false;
    };
    xhr.onerror = function() {
        // Handle error
        checkmarkSubmitElement.classList.remove("show");
        checkmarkSubmitElement.classList.add("hide");
        submitButton.disabled = false;
    };
    xhr.send(formData);
}

function validateShortenUrlInput() {
    var shortenUrlInput = document.getElementById("shorten");
    var feedbackElement = document.getElementById("shorten-feedback");

    if (shortenUrlInput.value.trim() === "") {
        shortenUrlInput.classList.add("is-invalid"); // Apply 'is-invalid' class
        shortenUrlInput.style.borderColor = "#dc3545";
        feedbackElement.style.display = "block";
        return false;
    } else {
        shortenUrlInput.classList.remove("is-invalid"); // Remove 'is-invalid' class
        shortenUrlInput.style.borderColor = "#d2d3d5";
        feedbackElement.style.display = "none";
        return true;
    }
}

let submitShortenUrlTimerMaxTime = Date.now();
let checkmarkSubmitShortenUrlCompleteTimer; // Define a global variable to hold the timer ID
let checkmarkSubmitShortenUrlSuccessTimer;
let hideCheckmarkSubmitShortenUrlTimer;

function submitShortenUrl() {
    if (!validateShortenUrlInput()) {
        return;
    }
    submitShortenUrlTimerMaxTime = Date.now();
    clearTimeout(hideCheckmarkSubmitShortenUrlTimer);
    clearTimeout(checkmarkSubmitShortenUrlSuccessTimer);
    clearTimeout(checkmarkSubmitShortenUrlCompleteTimer);
    $("#check-submit-shorten-url").attr("class", "check");
    $("#fill-submit-shorten-url").attr("class", "fill");
    $("#path-submit-shorten-url").attr("class", "path");
    var checkmarkElement = document.getElementById("checkmark-submit-shorten-url");
    checkmarkElement.classList.remove("hide");
    checkmarkElement.classList.add("show");

    var submitButton = document.getElementById("submit-shorten-url-btn");
    submitButton.disabled = true;
    clearResponseDiv("response-shorten-url");
    var form = document.getElementById("shortenUrlForm");
    var formData = new FormData(form);

    var xhr = new XMLHttpRequest();
    xhr.open("POST", "/", true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState === XMLHttpRequest.DONE) {
            var checkHttp = checkHttpStatus(xhr, "response-shorten-url");
            if (checkHttp) {
                checkmarkSubmitShortenUrlCompleteTimer = setTimeout(function (timestamp, checkHttp) {
                    if ((timestamp < submitShortenUrlTimerMaxTime) || !checkHttp) {
                        return;
                    }
                    $("#check-submit-shorten-url").attr("class", "check check-complete");
                    $("#fill-submit-shorten-url").attr("class", "fill fill-complete");
                }, 100, submitShortenUrlTimerMaxTime, checkHttp);
                checkmarkSubmitShortenUrlSuccessTimer = setTimeout(function (timestamp, checkHttp) {
                    if ((timestamp < submitShortenUrlTimerMaxTime) || !checkHttp) {
                        return;
                    }
                    $("#check-submit-shorten-url").attr("class", "check check-complete success");
                    $("#fill-submit-shorten-url").attr("class", "fill fill-complete success");
                    $("#path-submit-shorten-url").attr("class", "path path-complete");
                }, 300, submitShortenUrlTimerMaxTime, checkHttp);
                hideCheckmarkSubmitShortenUrlTimer = setTimeout(function (timestamp, checkHttp) {
                    if ((timestamp < submitShortenUrlTimerMaxTime) || !checkHttp) {
                        return;
                    }
                    checkmarkElement.classList.remove("show");
                    checkmarkElement.classList.add("hide");
                }, 3500, submitShortenUrlTimerMaxTime, checkHttp);
            } else {
                checkmarkElement.classList.remove("show");
                checkmarkElement.classList.add("hide");
            }
        }
        submitButton.disabled = false;
    };
    xhr.onerror = function() {
        // Handle error
        checkmarkElement.classList.remove("show");
        checkmarkElement.classList.add("hide");
        submitButton.disabled = false;
    };
    xhr.send(formData);
}

function validateScriptInput() {
    var script = editor.getValue();
    var feedbackElement = document.getElementById("script-feedback");
    if ((script === "") || (script === null)) {
        // feedbackElement.style.display = "block";
        feedbackElement.classList.remove("hide");
        feedbackElement.classList.add("show");
        setTimeout(function () {
            feedbackElement.classList.remove("show");
            feedbackElement.classList.add("hide");
        }, 3000);
        return false;
    } else {
        feedbackElement.classList.remove("show");
        feedbackElement.classList.add("hide");
        return true;
    }
}

let submitScriptTimerMaxTime = Date.now();
let checkmarkSubmitScriptCompleteTimer; // Define a global variable to hold the timer ID
let checkmarkSubmitScriptSuccessTimer;
let hideCheckmarkSubmitScriptTimer;

function submitScript() {
    if (!validateScriptInput()) {
        return;
    }
    submitScriptTimerMaxTime = Date.now();
    clearTimeout(hideCheckmarkSubmitScriptTimer);
    clearTimeout(checkmarkSubmitScriptSuccessTimer);
    clearTimeout(checkmarkSubmitScriptCompleteTimer);
    $("#check-submit-script").attr("class", "check");
    $("#fill-submit-script").attr("class", "fill");
    $("#path-submit-script").attr("class", "path");
    var checkmarkSubmitElement = document.getElementById("checkmark-submit-script");
    checkmarkSubmitElement.classList.remove("hide");
    checkmarkSubmitElement.classList.add("show");

    var submitButton = document.getElementById("submit-script-btn");
    submitButton.disabled = true;
    clearResponseDiv("response-script");

    var script = editor.getValue();
    var fileInput = document.getElementById("file-script");
    // If it's text, create a Blob containing the text
    var blob = new Blob([script], { type: "text/plain" });
    // Create a new DataTransfer object
    var dataTransfer = new DataTransfer();
    // Add the blob as a file to the DataTransfer object
    var file = new File([blob], "plaintext.txt", { type: "text/plain" });
    dataTransfer.items.add(file);
    // Assign the DataTransfer object to the files property
    fileInput.files = dataTransfer.files;

    var form = document.getElementById("scriptForm");
    var formData = new FormData(form);
    formData.append("file", file);

    var xhr = new XMLHttpRequest();
    xhr.open("POST", "/", true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState === XMLHttpRequest.DONE) {
            var checkHttp = checkHttpStatus(xhr, "response-script")
            if (checkHttp) {
                checkmarkSubmitScriptCompleteTimer = setTimeout(function (timestamp, checkHttp) {
                    if ((timestamp < submitScriptTimerMaxTime) || !checkHttp) {
                        return;
                    }
                    $("#check-submit-script").attr("class", "check check-complete");
                    $("#fill-submit-script").attr("class", "fill fill-complete");
                }, 100, submitScriptTimerMaxTime, checkHttp);
                checkmarkSubmitScriptSuccessTimer = setTimeout(function (timestamp, checkHttp) {
                    if ((timestamp < submitScriptTimerMaxTime) || !checkHttp) {
                        return;
                    }
                    $("#check-submit-script").attr("class", "check check-complete success");
                    $("#fill-submit-script").attr("class", "fill fill-complete success");
                    $("#path-submit-script").attr("class", "path path-complete");
                }, 300, submitScriptTimerMaxTime, checkHttp);
                hideCheckmarkSubmitScriptTimer = setTimeout(function (timestamp, checkHttp) {
                    if ((timestamp < submitScriptTimerMaxTime) || !checkHttp) {
                        return;
                    }
                    checkmarkSubmitElement.classList.remove("show");
                    checkmarkSubmitElement.classList.add("hide");
                }, 3500, submitScriptTimerMaxTime, checkHttp);
            } else {
                checkmarkSubmitElement.classList.remove("show");
                checkmarkSubmitElement.classList.add("hide");
            }
        }
        submitButton.disabled = false;
    };
    xhr.onerror = function() {
        // Handle error
        checkmarkSubmitElement.classList.remove("show");
        checkmarkSubmitElement.classList.add("hide");
        submitButton.disabled = false;
    };
    xhr.send(formData);
}

let downloadFromUrlTimerMaxTime = Date.now();
let checkmarkDownloadFromUrlCompleteTimer; // Define a global variable to hold the timer ID
let checkmarkDownloadFromUrlSuccessTimer;
let hideCheckmarkDownloadFromUrlTimer;

function getFileFromUrl() {
    var downloadLink = document.getElementById("download-url").value;
    downloadLink.disabled = true;

    try {
        new URL(downloadLink);
        downloadFromUrlTimerMaxTime = Date.now();
        clearTimeout(checkmarkDownloadFromUrlCompleteTimer);
        clearTimeout(checkmarkDownloadFromUrlSuccessTimer);
        clearTimeout(hideCheckmarkDownloadFromUrlTimer);
        $("#check-download").attr("class", "check");
        $("#fill-download").attr("class", "fill");
        $("#path-download").attr("class", "path");
        var checkmarkElement = document.getElementById("checkmark-download");
        checkmarkElement.classList.remove("hide");
        checkmarkElement.classList.add("show");

        var formData = new FormData();
        formData.append("url", downloadLink);

        var xhr = new XMLHttpRequest();
        xhr.open("POST", "/fetch-file", true);
        xhr.onreadystatechange = function () {
            if (xhr.status === 200) {
                // Request was successful, handle the response
                editor.setValue(xhr.responseText);
                clearResponseDiv("response-script");
                checkmarkDownloadFromUrlCompleteTimer = setTimeout(function (timestamp) {
                    if (timestamp < downloadFromUrlTimerMaxTime) {
                        return;
                    }
                    $("#check-download").attr("class", "check check-complete");
                    $("#fill-download").attr("class", "fill fill-complete");
                }, 100, downloadFromUrlTimerMaxTime);
                checkmarkDownloadFromUrlSuccessTimer = setTimeout(function (timestamp) {
                    if (timestamp < downloadFromUrlTimerMaxTime) {
                        return;
                    }
                    $("#check-download").attr("class", "check check-complete success");
                    $("#fill-download").attr("class", "fill fill-complete success");
                    $("#path-download").attr("class", "path path-complete");
                }, 300, downloadFromUrlTimerMaxTime);
                hideCheckmarkDownloadFromUrlTimer = setTimeout(function (timestamp) {
                    if (timestamp < downloadFromUrlTimerMaxTime) {
                        return;
                    }
                    checkmarkElement.classList.remove("show");
                    checkmarkElement.classList.add("hide");
                }, 3500, downloadFromUrlTimerMaxTime);
            } else if (xhr.readyState === 4) {
                // Request failed
                alert("There was a problem with the fetch operation: " + xhr.status + " - " + xhr.statusText);
                checkmarkElement.classList.remove("show");
                checkmarkElement.classList.add("hide");
            }
        };
        xhr.onerror = function() {
            // Handle error
            checkmarkElement.classList.remove("show");
            checkmarkElement.classList.add("hide");
        };
        // Send the POST request
        xhr.send(formData);
    } catch (error) {
        alert("Invalid download link", error);
    }
    downloadLink.disabled = false;
}

function clearResponseDiv(responseDivId) {
    var responseDiv = document.getElementById(responseDivId);
    responseDiv.style.display = "none";
    responseDiv.textContent = ""; // Clear the response text
    responseDiv.className = "";
}

function checkHttpStatus(xhr, responseDivId) {
    if (xhr.status === 200) {
        showResponse(xhr.responseText.trim(), xhr.status, responseDivId, xhr);
        return true;
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
    return false;
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
            button.className = "btn btn-secondary ms-2";
            var copyButton = document.getElementById("copy-button-" + responseDivId);
            copyButton.className = "btn btn-secondary ms-2";
            copyButton.disabled = true;
            var urlInNewTabButton = document.getElementById("url-in-new-tab-button-" + responseDivId);
            urlInNewTabButton.className = "btn btn-secondary ms-2";
            urlInNewTabButton.disabled = true;
            var scanQrCodeButton = document.getElementById("scan-qr-code-button-" + responseDivId);
            scanQrCodeButton.className = "btn btn-secondary ms-2";
            scanQrCodeButton.disabled = true;
            var responseDiv = document.getElementById(responseDivId);
            responseDiv.className = "mt-3 alert alert-secondary d-flex justify-content-between align-items-center";
            var codeElement = document.getElementById("response-code-" + responseDivId);
            codeElement.style.textDecoration = "line-through";
            codeElement.style.color = "#41464b"
            codeElement.setAttribute("title", "Link is not available");
            alert('Delete request successful');
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
