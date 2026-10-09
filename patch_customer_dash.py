import os

f1 = "frontend/js/customer-dashboard.js"
with open(f1, "r", encoding="utf-8") as f:
    c1 = f.read()

# Find the auth block
old_logic = """    if (!user) {
        window.location.href = "../index.html";
        return;
    }"""
    
new_logic = """    if (!user) {
        window.location.href = "../index.html";
        return;
    }
    
    // Redirect if they belong to a different dashboard
    if (user.role === "superadmin") {
        window.location.href = "../superadmin/superadmin-logs.html";
        return;
    } else if (user.role === "admin") {
        window.location.href = "../admin/dashboard.html";
        return;
    } else if (user.role === "staff") {
        window.location.href = "../staff/dashboard.html";
        return;
    }"""
    
if "if (user.role ===" not in c1:
    c1 = c1.replace(old_logic, new_logic)
    with open(f1, "w", encoding="utf-8") as f:
        f.write(c1)
        print("Updated customer-dashboard.js")
