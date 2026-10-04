fetch("../components/customer-sidebar.html")
    .then(response => {

        if (!response.ok) {
            throw new Error("Failed to load customer sidebar.");
        }

        return response.text();
    })
    .then(data => {

        // Insert sidebar into the page
        const sidebarContainer =
            document.getElementById("sidebar-container");

        if (!sidebarContainer) {
            console.error("sidebar-container was not found.");
            return;
        }

        sidebarContainer.innerHTML = data;

        loadUserProfile();

        const toggleBtn =
            document.querySelector(".toggle-btn");

        if (toggleBtn) {
            toggleBtn.addEventListener("click", toggleSidebar);
        }

        setActiveSidebarLink();

        fetch("../components/logout-modal.html")
            .then(response => {

                if (!response.ok) {
                    throw new Error("Failed to load logout modal.");
                }

                return response.text();
            })
            .then(modalData => {

                const modalWrapper =
                    document.getElementById("logout-modal-wrapper");

                if (modalWrapper) {
                    modalWrapper.innerHTML = modalData;

                    // Initialize logout modal
                    if (typeof initLogoutModal === "function") {
                        initLogoutModal();
                    }
                }

            })
            .catch(error => {
                console.error(
                    "Error loading logout modal:",
                    error
                );
            });

    })
    .catch(error => {
        console.error(
            "Error loading sidebar:",
            error
        );
    });

function setActiveSidebarLink() {

    // Get current page filename
    const currentPage =
        window.location.pathname
            .split("/")
            .pop()
            .toLowerCase();


    console.log("Current page:", currentPage);


    // Get all sidebar links
    const sidebarLinks =
        document.querySelectorAll(".menu li a");


    sidebarLinks.forEach(link => {

        // Get the link's href
        const href =
            link.getAttribute("href");


        if (!href) {
            return;
        }


        // Get only the filename from the href
        const linkPage =
            href
                .split("/")
                .pop()
                .split("?")[0]
                .toLowerCase();


        // Remove active from every link first
        link.classList.remove("active");


        // Compare current page with link page
        if (currentPage === linkPage) {

            link.classList.add("active");

            console.log(
                "Active sidebar link:",
                linkPage
            );
        }

    });
}

function toggleSidebar() {

    const sidebar =
        document.querySelector(".sidebar");

    const dashboardContainer =
        document.querySelector(".dashboard-container");


    if (sidebar) {

        sidebar.classList.toggle("collapsed");

    }


    if (dashboardContainer) {

        dashboardContainer.classList.toggle(
            "sidebar-collapsed"
        );

    }

}

function loadUserProfile() {

    const user =
        JSON.parse(localStorage.getItem("user"));


    // Stop if there is no logged-in user
    if (!user) {
        console.log("No user profile found.");
        return;
    }


    // Get first name
    const firstName =
        user.full_name
            .trim()
            .split(" ")[0];


    // Profile name
    const profileName =
        document.getElementById("profileName");

    if (profileName) {
        profileName.textContent = firstName;
    }


    // Determine role
    let displayRole = "Customer";


    if (user.role === "admin") {

        displayRole = "Admin";

    }
    else if (user.role === "staff") {

        displayRole = "Staff";

    }
    else if (user.role === "community_user") {

        displayRole = "User";

    }


    // Profile role
    const profileRole =
        document.getElementById("profileRole");

    if (profileRole) {
        profileRole.textContent =
            displayRole.toUpperCase();
    }


    // Profile avatar
    const profileAvatar =
        document.getElementById("profileAvatar");

    if (profileAvatar) {

        profileAvatar.textContent =
            firstName
                .charAt(0)
                .toUpperCase();

    }

}
