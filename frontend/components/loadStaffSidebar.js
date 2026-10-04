fetch("../components/staff-sidebar.html")
    .then(response => {
        if (!response.ok) {
            throw new Error("Failed to load staff sidebar.");
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
        console.error("Error loading staff sidebar:", error);
    });

function setActiveSidebarLink() {
    const currentPage = window.location.pathname.split("/").pop().toLowerCase();
    const sidebarLinks = document.querySelectorAll(".menu li a");

    sidebarLinks.forEach(link => {
        const href = link.getAttribute("href");
        if (!href) return;

        const linkPage = href.split("/").pop().split("?")[0].toLowerCase();
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
    const profileName = document.getElementById("profileName");
    const profileRole = document.getElementById("profileRole");
    const profileAvatar = document.getElementById("profileAvatar");

    if (!user) {
        if (profileName) profileName.textContent = "Staff";
        if (profileRole) profileRole.textContent = "STAFF";
        if (profileAvatar) profileAvatar.textContent = "S";
        return;
    }

    const fullName = user.full_name || "Staff";
    const firstName = fullName.trim().split(" ")[0];

    if (profileName) {
        profileName.textContent = firstName.charAt(0).toUpperCase() + firstName.slice(1);
    }

    if (profileRole) {
        profileRole.textContent = "STAFF";
    }

    if (profileAvatar) {
        profileAvatar.textContent = firstName.charAt(0).toUpperCase();
    }
}