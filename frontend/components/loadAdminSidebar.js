fetch("../components/admin-sidebar.html")
    .then(response => {
        if (!response.ok) {
            throw new Error("Failed to load admin sidebar.");
        }
        return response.text();
    })
    .then(data => {
        const sidebarContainer = document.getElementById("sidebar-container");
        if (!sidebarContainer) {
            console.error("sidebar-container not found.");
            return;
        }

        sidebarContainer.innerHTML = data;

        loadUserProfile();
        loadProfileModal();

        const toggleBtn = document.querySelector(".toggle-btn");

        if (toggleBtn) {
            toggleBtn.addEventListener("click", toggleSidebar);
        }

        setActiveSidebarLink();

        // Load logout modal
        fetch("../components/logout-modal.html")
            .then(response => {
                if (!response.ok) {
                    throw new Error("Failed to load logout modal.");
                }
                return response.text();
            })
            .then(modalData => {
                const modalWrapper = document.getElementById("logout-modal-wrapper");
                if (modalWrapper) {
                    modalWrapper.innerHTML = modalData;
                    if (typeof initLogoutModal === "function") {
                        initLogoutModal();
                    }
                }
            })
            .catch(error => {
                console.error("Error loading logout modal:", error);
            });
    })
    .catch(error => {
        console.error("Error loading admin sidebar:", error);
    });

function setActiveSidebarLink() {
    const currentPage = window.location.pathname
        .split("/")
        .pop()
        .toLowerCase();

    const sidebarLinks = document.querySelectorAll(".menu li a");

    sidebarLinks.forEach(link => {
        const href = link.getAttribute("href");
        if (!href) return;

        const linkPage = href
            .split("/")
            .pop()
            .split("?")[0]
            .toLowerCase();

        link.classList.remove("active");

        if (currentPage === linkPage) {
            link.classList.add("active");
        }
    });
}

function toggleSidebar() {
    const sidebar = document.querySelector(".sidebar");
    const dashboardContainer = document.querySelector(".dashboard-container");

    if (sidebar) {
        sidebar.classList.toggle("collapsed");
    }
    if (dashboardContainer) {
        dashboardContainer.classList.toggle("sidebar-collapsed");
    }
}

function loadUserProfile() {
    const user = JSON.parse(localStorage.getItem("user"));

    if (!user) {
        console.log("No user profile found.");
        return;
    }

    const firstName = user.full_name.trim().split(" ")[0];

    const profileName = document.getElementById("profileName");
    if (profileName) {
        profileName.textContent = firstName.toUpperCase();
    }

    const profileRole = document.getElementById("profileRole");
    if (profileRole) {
        profileRole.textContent = user.role === "admin"
            ? "ADMIN"
            : user.role.toUpperCase();
    }

    const profileAvatar = document.getElementById("profileAvatar");
    if (profileAvatar) {
        profileAvatar.textContent = firstName.charAt(0).toUpperCase();
    }
}
