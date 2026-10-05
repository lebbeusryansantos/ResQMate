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

    const overlayBg =
        document.getElementById("profileModalOverlay");

    if (!profileBtn || !profileModal) return;

    profileBtn.addEventListener("click", () => {

        const user =
            JSON.parse(localStorage.getItem("user"));

        if (user) {

            // Derive first/last name
            let firstName = user.first_name || "";
            let lastName  = user.last_name  || "";

            // Fallback: split full_name if individual fields are absent
            if (!firstName && !lastName && user.full_name) {
                const parts = user.full_name.trim().split(/\s+/);
                firstName = parts[0] || "";
                lastName  = parts.slice(1).join(" ") || "";
            }

            const fullName = (firstName + " " + lastName).trim() || user.full_name || "";
            const firstLetter = fullName.charAt(0).toUpperCase() || "?";

            document.getElementById("modalAvatar").textContent =
                firstLetter;

            const firstNameEl = document.getElementById("profileFirstName");
            const lastNameEl  = document.getElementById("profileLastName");

            if (firstNameEl) firstNameEl.value = firstName;
            if (lastNameEl)  lastNameEl.value  = lastName;

            document.getElementById("profileEmail").value =
                user.email || "";

            document.getElementById("profileRoleInput").value =
                user.role === "admin"
                    ? "Administrator"
                    : user.role === "staff"
                        ? "Staff"
                        : "Community User";

            document.getElementById("modalName").textContent =
                fullName;

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

    function closeModal() {
        profileModal.classList.remove("show");
    }

    if (closeBtn) {
        closeBtn.addEventListener("click", closeModal);
    }

    // Click outside (on overlay background) to close
    if (overlayBg) {
        overlayBg.addEventListener("click", closeModal);
    }
}
