document.addEventListener("DOMContentLoaded", () => {
    const sidebarContainer = document.getElementById("sidebar-container");
    if (!sidebarContainer) return;
    
    sidebarContainer.innerHTML = `
    <nav class="sidebar">
        <div class="sidebar-header">
            <h2><i class="fa-solid fa-shield-halved"></i> ResQMate</h2>
            <p>Master Admin</p>
        </div>
        <ul class="nav-links">
            <li>
                <a href="superadmin-logs.html" class="active">
                    <i class="fa-solid fa-list-check"></i> Audit Logs
                </a>
            </li>
        </ul>
        
        <div class="sidebar-footer">
            <button class="logout-btn" onclick="document.getElementById('logoutModal').classList.add('show')">
                <i class="fa-solid fa-arrow-right-from-bracket"></i> Logout
            </button>
        </div>
    </nav>`;
});
