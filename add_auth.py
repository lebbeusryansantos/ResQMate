import os

auth_block = """
document.addEventListener("DOMContentLoaded", () => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
        alert("You are not logged in. Please log in first.");
        window.location.href = "../index.html";
        return;
    }
    const parsedUser = JSON.parse(storedUser);
    if (parsedUser.role === "superadmin") { window.location.href = "../superadmin/superadmin-logs.html"; return; }
    if (parsedUser.role === "admin") { window.location.href = "../admin/dashboard.html"; return; }
    if (parsedUser.role === "staff") { window.location.href = "../staff/dashboard.html"; return; }
});
"""

files = [
    "frontend/js/customer-request.js",
    "frontend/js/customer-notification.js"
]

for f_path in files:
    with open(f_path, "r", encoding="utf-8") as f:
        c = f.read()
    if "parsedUser.role ===" not in c:
        with open(f_path, "w", encoding="utf-8") as f:
            f.write(auth_block + "\n" + c)
        print(f"Added auth block to {f_path}")
