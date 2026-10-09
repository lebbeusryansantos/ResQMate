import os

files_to_patch = [
    "frontend/js/customer-request.js",
    "frontend/js/customer-notification.js"
]

new_logic = """    if (!storedUser) {
        alert("You are not logged in. Please log in first.");
        window.location.href = "../index.html";
        return;
    }
    const parsedUser = JSON.parse(storedUser);
    if (parsedUser.role === "superadmin") { window.location.href = "../superadmin/superadmin-logs.html"; return; }
    if (parsedUser.role === "admin") { window.location.href = "../admin/dashboard.html"; return; }
    if (parsedUser.role === "staff") { window.location.href = "../staff/dashboard.html"; return; }
"""

for f_path in files_to_patch:
    if os.path.exists(f_path):
        with open(f_path, "r", encoding="utf-8") as f:
            c = f.read()
        
        old_logic = """    if (!storedUser) {
        alert("You are not logged in. Please log in first.");
        window.location.href = "../index.html";
        return;
    }"""
        
        if "parsedUser.role" not in c and old_logic in c:
            c = c.replace(old_logic, new_logic)
            with open(f_path, "w", encoding="utf-8") as f:
                f.write(c)
            print(f"Updated {f_path}")
