document.addEventListener("DOMContentLoaded", () => {
    const sidebarContainer = document.getElementById("sidebar-container");
    if (!sidebarContainer) return;
    
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const firstName = user.full_name ? user.full_name.trim().split(" ")[0].toUpperCase() : "MASTER";
    const initial = firstName.charAt(0);
    
    sidebarContainer.innerHTML = `
    <aside class="sidebar">
        <div class="sidebar-header-wrapper"
            style="display: flex; align-items: center; justify-content: space-between; padding-right: 4px;">
            <div class="logo" style="padding: 15px 10px; margin-bottom: 10px;">
                <img src="../assets/logo.png" alt="ResQMate Logo">
                <h2>ResQMate</h2>
            </div>
            <!-- Toggle Button -->
            <button class="toggle-btn" aria-label="Toggle Sidebar"
                style="background: transparent; border: none; color: #94a3b8; font-size: 1.1rem; cursor: pointer; padding: 8px; border-radius: 8px;">
                <i class="fa-solid fa-bars"></i>
            </button>
        </div>

        <ul class="menu">
            <li>
                <a href="superadmin-logs.html" class="active">
                    <i class="fa-solid fa-list-check"></i>
                    <span>Audit Logs</span>
                </a>
            </li>
        </ul>

        <!-- Bottom Section -->
        <div class="sidebar-bottom">
            <div class="sidebar-footer-row">

                <button class="profile-button" id="openProfileModal">
                    <div class="profile-avatar" id="profileAvatar">${initial}</div>

                    <div class="profile-info">
                        <strong id="profileName">${firstName}</strong>
                        <span id="profileRole">MASTER ADMIN</span>
                    </div>
                </button>

                <!-- Logout Button -->
                <div class="logout">
                    <button title="Logout" onclick="document.getElementById('logoutModal').classList.add('show')">
                        <i class="fas fa-sign-out-alt"></i>
                        <span>Logout</span>
                    </button>
                </div>
            </div>
        </div>
    </aside>`;

    // Quick toggle sidebar
    const toggleBtn = document.querySelector(".toggle-btn");
    if (toggleBtn) {
        toggleBtn.addEventListener("click", () => {
            const sidebar = document.querySelector(".sidebar");
            const dashboardContainer = document.querySelector(".dashboard-container");
            if (sidebar) sidebar.classList.toggle("collapsed");
            if (dashboardContainer) dashboardContainer.classList.toggle("sidebar-collapsed");
        });
    }
});
