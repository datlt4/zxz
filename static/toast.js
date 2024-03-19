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
    var toastTimer = setTimeout(function() {bsToast.hide()}, 6660);

    toastElement.classList.add('toast', 'mb-2');
    var closeButton = toastElement.querySelector(".btn-close");
        closeButton.addEventListener("click", function(){
            clearTimeout(toastTimer);
            bsToast.hide();
    });
}
