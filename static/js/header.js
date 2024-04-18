document.addEventListener("DOMContentLoaded", function () {
    // const avatar = document.getElementById('avatar');
    const avatar = document.getElementById('avatar');
    if (avatar) {
        avatar.addEventListener('click', function () {
            avatar.classList.toggle('active');
            document.getElementById("popup-user-profile").classList.toggle("show");
        });
    }
});
