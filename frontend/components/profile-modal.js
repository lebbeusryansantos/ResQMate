window.loadProfileModal = function () {

    fetch("../components/profile-modal.html")
        .then(response => response.text())
        .then(data => {

            document.getElementById(
                "profile-modal-wrapper"
            ).innerHTML = data;

            initProfileModal();

        })
        .catch(error => {
            console.error(
                "Error loading profile modal:",
                error
            );
        });
}

function initProfileModal() {

    const profileBtn =
        document.getElementById("openProfileModal");

    const profileModal =
        document.getElementById("profileModal");

    const closeBtn =
        document.getElementById("closeProfileModal");

    if (!profileBtn || !profileModal) return;

    profileBtn.addEventListener("click", () => {

        const user =
            JSON.parse(localStorage.getItem("user"));

        if (user) {

            const firstLetter =
                user.full_name
                    ? user.full_name.trim().charAt(0).toUpperCase()
                    : "?";

            document.getElementById("modalAvatar").textContent =
                firstLetter;


            document.getElementById("profileFullName").value =
                user.full_name || "";

            document.getElementById("profileEmail").value =
                user.email || "";

            document.getElementById("profileRoleInput").value =
                user.role === "admin"
                    ? "Administrator"
                    : user.role === "staff"
                        ? "Staff"
                        : "Community User";

            document.getElementById("modalName").textContent =
                user.full_name || "";

            document.getElementById("modalRole").textContent =
                user.role === "admin"
                    ? "Administrator"
                    : user.role === "staff"
                        ? "Staff"
                        : "Community User";
            document.getElementById("profilePassword").value = "";
        }

        profileModal.classList.add("show");
    });

    if (closeBtn) {
        closeBtn.addEventListener("click", () => {
            profileModal.classList.remove("show");
        });
    }
}

