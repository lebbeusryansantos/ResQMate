"""
CRITICAL REFACTOR: Remove superadmin role entirely.
Keep audit logs, migrate to standard admin access.
"""
import os, shutil, re

ROOT = "."

# ============================================================
# 1. Create admin-logs.html
# ============================================================
admin_logs_html = r"""<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ResQMate - Audit Logs</title>

  <link rel="stylesheet" href="../style/customer-sidebar.css">
  <link rel="stylesheet" href="../style/admin-shared.css">
  <link rel="stylesheet" href="../style/logout-modal.css">
  <link rel="stylesheet" href="../style/profile-modal.css">

  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>

<body>

  <div class="dashboard-container">

    <div id="sidebar-container"></div>
    <div id="logout-modal-wrapper"></div>
    <div id="profile-modal-wrapper"></div>

    <main class="main-content">

      <div class="topbar">
        <h2>Global Audit Logs</h2>
        <p>Monitor system-wide administrative actions</p>
      </div>

      <div class="table-card">
        <div class="toolbar-row">
          <h5 class="section-title">Audit Records</h5>
          <div class="toolbar-actions">
            <input type="text" id="searchLog" placeholder="Search logs..." class="search-input">
            
            <select id="roleFilter" class="filter-dropdown">
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="staff">Staff</option>
              <option value="community_user">Community User</option>
            </select>
            
            <select id="rowsPerPage" class="filter-dropdown">
                <option value="10">10 Rows per page</option>
                <option value="25">25 Rows per page</option>
                <option value="50">50 Rows per page</option>
            </select>
          </div>
        </div>

        <div class="table-responsive">
          <table class="data-table" id="logsTable">
            <thead>
              <tr>
                <th>Log ID</th>
                <th>User ID</th>
                <th>Name</th>
                <th>Role</th>
                <th>Action</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
            </tbody>
          </table>
        </div>

        <div class="pagination-container" style="display: flex; justify-content: space-between; align-items: center; margin-top: 15px;">
          <span id="pageIndicator" class="page-info">Showing 0 to 0 of 0 entries</span>
          <div class="pagination-controls">
            <button id="prevPageBtn" class="rq-btn-secondary" disabled>Previous</button>
            <button id="nextPageBtn" class="rq-btn-secondary" disabled>Next</button>
          </div>
        </div>

      </div>

    </main>
  </div>

  <script src="../js/config.js"></script>
  <script src="../components/loadAdminSidebar.js"></script>
  <script src="../components/profile-modal.js"></script>
  <script src="../components/logout-modal.js"></script>
  <script src="../js/admin-logs.js"></script>
</body>
</html>
"""

with open("frontend/admin/admin-logs.html", "w", encoding="utf-8") as f:
    f.write(admin_logs_html)
print("[1] Created frontend/admin/admin-logs.html")


# ============================================================
# 2. Create admin-logs.js
# ============================================================
admin_logs_js = r"""document.addEventListener("DOMContentLoaded", () => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || user.role !== "admin") {
        alert("Access Denied: Admin role required.");
        window.location.href = "../index.html";
        return;
    }

    const logsTableBody = document.querySelector("#logsTable tbody");
    const searchLog = document.getElementById("searchLog");
    const roleFilter = document.getElementById("roleFilter");
    const rowsPerPageSelect = document.getElementById("rowsPerPage");
    
    const prevPageBtn = document.getElementById("prevPageBtn");
    const nextPageBtn = document.getElementById("nextPageBtn");
    const pageIndicator = document.getElementById("pageIndicator");

    let allLogs = [];
    let filteredLogs = [];
    let currentPage = 1;
    let itemsPerPage = 10;

    loadLogs();

    async function loadLogs() {
        try {
            const response = await fetch(`${API_URL}/audit_logs`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (response.status === 401 || response.status === 403) {
                alert("Unauthorized");
                window.location.href = "../index.html";
                return;
            }
            
            const logs = await response.json();
            allLogs = logs;
            applyFilters();
        } catch (error) {
            console.error("Failed to load audit logs", error);
        }
    }

    function applyFilters() {
        const query = searchLog.value.toLowerCase().trim();
        const role = roleFilter.value;

        filteredLogs = allLogs.filter(log => {
            const matchSearch = log.action_description.toLowerCase().includes(query) || 
                                log.user_name.toLowerCase().includes(query) ||
                                String(log.user_id).includes(query);
            const matchRole = (role === 'all' || log.user_role === role);
            return matchSearch && matchRole;
        });

        currentPage = 1;
        renderDOM();
    }

    function renderDOM() {
        logsTableBody.innerHTML = "";

        const totalFiltered = filteredLogs.length;
        const totalPages = Math.ceil(totalFiltered / itemsPerPage);
        
        if (totalFiltered === 0) {
            logsTableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #6b7280; padding: 20px;">No matching records found</td></tr>`;
            pageIndicator.textContent = `Showing 0 to 0 of 0 entries`;
            prevPageBtn.disabled = true;
            nextPageBtn.disabled = true;
            return;
        }

        const startIndex = (currentPage - 1) * itemsPerPage;
        let endIndex = startIndex + itemsPerPage;
        if (endIndex > totalFiltered) endIndex = totalFiltered;

        const paginated = filteredLogs.slice(startIndex, endIndex);

        paginated.forEach(log => {
            const roleClass = log.user_role === 'admin' ? 'role-admin' :
                              log.user_role === 'staff' ? 'role-staff' : 'role-user';
                              
            let formattedDate = "N/A";
            if (log.timestamp) {
                const dateObj = new Date(log.timestamp + "Z");
                formattedDate = dateObj.toLocaleString();
                if (formattedDate === "Invalid Date") {
                     const dateObj2 = new Date(log.timestamp);
                     formattedDate = dateObj2.toLocaleString();
                }
            }

            logsTableBody.innerHTML += `
                <tr>
                    <td>#${log.id}</td>
                    <td>#${log.user_id}</td>
                    <td><strong>${log.user_name}</strong></td>
                    <td><span class="role-badge ${roleClass}">${log.user_role.replace('_', ' ').toUpperCase()}</span></td>
                    <td>${log.action_description}</td>
                    <td>${formattedDate}</td>
                </tr>
            `;
        });

        pageIndicator.textContent = `Showing ${startIndex + 1} to ${endIndex} of ${totalFiltered} entries`;
        prevPageBtn.disabled = currentPage === 1;
        nextPageBtn.disabled = currentPage === totalPages;
    }

    searchLog.addEventListener("input", applyFilters);
    roleFilter.addEventListener("change", applyFilters);
    
    rowsPerPageSelect.addEventListener("change", (e) => {
        itemsPerPage = parseInt(e.target.value);
        currentPage = 1;
        renderDOM();
    });

    prevPageBtn.addEventListener("click", () => {
        if (currentPage > 1) {
            currentPage--;
            renderDOM();
        }
    });

    nextPageBtn.addEventListener("click", () => {
        const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            renderDOM();
        }
    });
});
"""

with open("frontend/js/admin-logs.js", "w", encoding="utf-8") as f:
    f.write(admin_logs_js)
print("[2] Created frontend/js/admin-logs.js")


# ============================================================
# 3. Fix login.js — remove superadmin redirect
# ============================================================
f = "frontend/js/login.js"
with open(f, "r", encoding="utf-8") as fh:
    lines = fh.readlines()

new_lines = []
skip_count = 0
for i, line in enumerate(lines):
    if skip_count > 0:
        skip_count -= 1
        continue
    stripped = line.strip()
    if stripped == 'if (data.role === "superadmin") {':
        # Skip this line + the href line + the closing brace line
        skip_count = 2
        continue
    # Also change "else if" to "if" for the admin block that follows
    if stripped == 'else if (data.role === "admin") {' and i > 0:
        # Check if the previous non-empty line was the closing brace we just skipped
        prev_real = [l for l in new_lines if l.strip()]
        if prev_real and prev_real[-1].strip() == 'alert("Login Successful");':
            line = line.replace('else if (data.role === "admin")', 'if (data.role === "admin")')
    new_lines.append(line)

with open(f, "w", encoding="utf-8") as fh:
    fh.writelines(new_lines)
print("[3] Updated login.js")


# ============================================================
# 4. Fix audit_logs.py — admin role
# ============================================================
f = "backend/routes/audit_logs.py"
with open(f, "r", encoding="utf-8") as fh:
    c = fh.read()
c = c.replace("from backend.security import get_current_superadmin", "from backend.security import get_current_admin")
c = c.replace("def get_audit_logs(admin: dict = Depends(get_current_superadmin)):", "def get_audit_logs(admin: dict = Depends(get_current_admin)):")
with open(f, "w", encoding="utf-8") as fh:
    fh.write(c)
print("[4] Updated audit_logs.py — admin protected")


# ============================================================
# 5. Add Audit Logs to admin sidebar
# ============================================================
f = "frontend/components/admin-sidebar.html"
with open(f, "r", encoding="utf-8") as fh:
    c = fh.read()

# Add Audit Logs tab after Users tab
users_block = """        <li>
            <a href="../admin/users.html">
                <i class="fa-solid fa-users"></i>
                <span>Users</span>
            </a>
        </li>

    </ul>"""

users_plus_logs = """        <li>
            <a href="../admin/users.html">
                <i class="fa-solid fa-users"></i>
                <span>Users</span>
            </a>
        </li>

        <li>
            <a href="../admin/admin-logs.html">
                <i class="fa-solid fa-list-check"></i>
                <span>Audit Logs</span>
            </a>
        </li>

    </ul>"""

c = c.replace(users_block, users_plus_logs)
with open(f, "w", encoding="utf-8") as fh:
    fh.write(c)
print("[5] Updated admin-sidebar.html — added Audit Logs tab")


# ============================================================
# 6. Fix loadSidebar.js — remove superadmin branch
# ============================================================
f = "frontend/components/loadSidebar.js"
with open(f, "r", encoding="utf-8") as fh:
    lines = fh.readlines()

new_lines = []
skip_count = 0
for i, line in enumerate(lines):
    if skip_count > 0:
        skip_count -= 1
        continue
    stripped = line.strip()
    if stripped == 'if (user.role === "superadmin") {':
        # skip this + displayRole line + closing brace
        skip_count = 2
        continue
    if stripped == 'else if (user.role === "admin") {':
        prev_real = [l for l in new_lines if l.strip()]
        if prev_real and 'displayRole' in prev_real[-1]:
            pass  # Keep else if
        else:
            line = line.replace('else if (user.role === "admin")', 'if (user.role === "admin")')
    new_lines.append(line)

with open(f, "w", encoding="utf-8") as fh:
    fh.writelines(new_lines)
print("[6] Updated loadSidebar.js")


# ============================================================
# 7. Fix loadAdminSidebar.js — remove superadmin branch
# ============================================================
f = "frontend/components/loadAdminSidebar.js"
with open(f, "r", encoding="utf-8") as fh:
    lines = fh.readlines()

new_lines = []
skip_count = 0
for i, line in enumerate(lines):
    if skip_count > 0:
        skip_count -= 1
        continue
    stripped = line.strip()
    if stripped == 'if (user.role === "superadmin") {':
        # skip this + the textContent line + closing brace with else
        skip_count = 2
        continue
    # Convert "} else if" to "if" for the admin block
    if '} else if (user.role === "admin")' in stripped:
        prev_real = [l for l in new_lines if l.strip()]
        # Check if we just skipped the superadmin block
        line = line.replace('} else if (user.role === "admin")', 'if (user.role === "admin")')
    new_lines.append(line)

with open(f, "w", encoding="utf-8") as fh:
    fh.writelines(new_lines)
print("[7] Updated loadAdminSidebar.js")


# ============================================================
# 8. Clean customer JS auth blocks — remove superadmin redirect
# ============================================================
for jsf in [
    "frontend/js/customer-request.js",
    "frontend/js/customer-notification.js",
    "frontend/js/customer-requests.js"
]:
    with open(jsf, "r", encoding="utf-8") as fh:
        lines = fh.readlines()
    
    new_lines = [l for l in lines if 'parsedUser.role === "superadmin"' not in l]
    
    with open(jsf, "w", encoding="utf-8") as fh:
        fh.writelines(new_lines)

print("[8] Cleaned superadmin redirects from customer JS files")


# ============================================================
# 9. Clean admin-users.js — remove superadmin badge/text
# ============================================================
f = "frontend/js/admin-users.js"
with open(f, "r", encoding="utf-8") as fh:
    lines = fh.readlines()

new_lines = []
skip_count = 0
for i, line in enumerate(lines):
    if skip_count > 0:
        skip_count -= 1
        continue
    stripped = line.strip()
    
    # Remove: user.role === "superadmin" ? "rq-badge-super" :
    if 'user.role === "superadmin"' in stripped and "rq-badge-super" in stripped:
        skip_count = 1  # skip next line too (the ternary continuation)
        continue
    
    # Remove: user.role === "superadmin" ? "MASTER ADMIN" :
    if 'user.role === "superadmin"' in stripped and "MASTER ADMIN" in stripped:
        skip_count = 1
        continue
    
    # Fix dangling ": user.role === ..." to start of ternary
    if stripped.startswith(': user.role === "admin"'):
        line = line.replace(': user.role ===', 'user.role ===')
    
    new_lines.append(line)

with open(f, "w", encoding="utf-8") as fh:
    fh.writelines(new_lines)
print("[9a] Updated admin-users.js")

# users.html — remove superadmin options
f = "frontend/admin/users.html"
with open(f, "r", encoding="utf-8") as fh:
    lines = fh.readlines()

new_lines = []
skip_count = 0
for i, line in enumerate(lines):
    if skip_count > 0:
        skip_count -= 1
        continue
    stripped = line.strip()
    if 'value="superadmin"' in stripped:
        # Skip this line + the text line + closing option tag + blank line
        skip_count = 2  # option value line + text + </option>
        # Check if next lines are text + </option>
        continue
    new_lines.append(line)

with open(f, "w", encoding="utf-8") as fh:
    fh.writelines(new_lines)
print("[9b] Updated users.html")


# ============================================================
# 10. Clean users.py — remove superadmin from role_maps and protection
# ============================================================
f = "backend/routes/users.py"
with open(f, "r", encoding="utf-8") as fh:
    lines = fh.readlines()

new_lines = []
skip_count = 0
for i, line in enumerate(lines):
    if skip_count > 0:
        skip_count -= 1
        continue
    stripped = line.strip()
    
    # Remove lines with superadmin role mapping
    if '"superadmin"' in stripped and '"superadmin"' in stripped and 'role_map' not in stripped:
        if stripped.startswith('"superadmin"'):
            continue
    
    # Remove the email protection block
    if "# Protect superadmin@gmail.com" in stripped:
        skip_count = 2  # skip the if line + db_role = 'superadmin'
        continue
    
    if "target_user.email in ['superadmin@gmail.com', 'masteradmin@gmail.com']" in stripped:
        skip_count = 1
        continue
    
    # Fix the "else:" that was part of the protection block to be standalone
    if stripped == "else:" and i > 0:
        prev = lines[i-1].strip() if i > 0 else ""
        if "db_role = 'superadmin'" in prev:
            continue
    
    new_lines.append(line)

with open(f, "w", encoding="utf-8") as fh:
    fh.writelines(new_lines)
print("[10] Updated users.py — removed superadmin entries")


# ============================================================
# 11. Delete superadmin-specific files
# ============================================================
files_to_delete = [
    "frontend/superadmin/superadmin-logs.html",
    "frontend/js/superadmin-logs.js",
    "frontend/components/loadSuperAdminSidebar.js"
]

for df in files_to_delete:
    if os.path.exists(df):
        os.remove(df)
        print(f"  Deleted: {df}")

if os.path.exists("frontend/superadmin") and not os.listdir("frontend/superadmin"):
    os.rmdir("frontend/superadmin")
    print("  Deleted empty directory: frontend/superadmin/")

print("\n=== REFACTOR COMPLETE ===")
