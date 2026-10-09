import os

# 1. Update loadSidebar.js
f1 = "frontend/components/loadSidebar.js"
with open(f1, "r", encoding="utf-8") as f:
    c1 = f.read()

old_logic_1 = """    if (user.role === "admin") {

        displayRole = "Admin";

    }"""
new_logic_1 = """    if (user.role === "superadmin") {
        displayRole = "Master Admin";
    }
    else if (user.role === "admin") {

        displayRole = "Admin";

    }"""
c1 = c1.replace(old_logic_1, new_logic_1)
with open(f1, "w", encoding="utf-8") as f:
    f.write(c1)

# 2. Update loadAdminSidebar.js
f2 = "frontend/components/loadAdminSidebar.js"
with open(f2, "r", encoding="utf-8") as f:
    c2 = f.read()

old_logic_2 = """    if (profileRole) {
        profileRole.textContent = user.role === "admin"
            ? "ADMIN"
            : user.role.toUpperCase();
    }"""
new_logic_2 = """    if (profileRole) {
        if (user.role === "superadmin") {
            profileRole.textContent = "MASTER ADMIN";
        } else if (user.role === "admin") {
            profileRole.textContent = "ADMIN";
        } else {
            profileRole.textContent = user.role.toUpperCase();
        }
    }"""
c2 = c2.replace(old_logic_2, new_logic_2)
with open(f2, "w", encoding="utf-8") as f:
    f.write(c2)

print("Updated sidebar js scripts")
