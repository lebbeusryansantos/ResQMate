// Core logic and operations for logout-modal
(function () {
    const API_BASE_URL =
        window.location.hostname === "127.0.0.1" ||
            window.location.hostname === "localhost"
            ? "http://127.0.0.1:8000"
            : "https://resqmate-backend.onrender.com";

    if (!window.logoutModalInitialized) {
        document.addEventListener("click", function (e) {
            const modal = document.getElementById("logoutModal");

            // Open Modal
            if (e.target.closest(".logout button")) {
                e.preventDefault();

                if (modal) {
                    modal.classList.add("show");
                }

                return;
            }

            // Close using X button
            if (e.target.closest("#closeModalBtn")) {
                if (modal) modal.classList.remove("show");
                return;
            }

            // Close using Cancel button
            if (e.target.closest("#cancelLogoutBtn")) {
                if (modal) modal.classList.remove("show");
                return;
            }

            // Close when clicking outside modal content
            if (e.target === modal) {
                if (modal) modal.classList.remove("show");
                return;
            }

            // Confirm Logout
            if (e.target.closest("#confirmLogoutBtn")) {
                e.preventDefault();

                const btn = e.target.closest("#confirmLogoutBtn");
                btn.textContent = "Logging out...";
                btn.style.pointerEvents = "none";

                const token = localStorage.getItem("token");

                const finalizeLogout = () => {
                    localStorage.removeItem("user");
                    localStorage.removeItem("token");

                    // Robust redirect that works locally and on Vercel
                    let redirectPath = "../index.html";
                    if (window.location.hostname !== "127.0.0.1" && window.location.hostname !== "localhost") {
                        redirectPath = "/";
                    }

                    window.location.href = redirectPath;
                };

                if (token) {
                    fetch(`${API_BASE_URL}/users/logout`, {
                        method: "POST",
                        headers: {
                            "Authorization": `Bearer ${token}`
                        }
                    }).finally(finalizeLogout);
                } else {
                    finalizeLogout();
                }
            }
        });

        window.logoutModalInitialized = true;
    }
})();

// Keep a dummy function for loadSidebar.js compatibility
window.initLogoutModal = function () { };
