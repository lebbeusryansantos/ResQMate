import os

js_path = "frontend/js/admin-users.js"
with open(js_path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace roleClass logic
old_class_logic = """        const roleClass =
            user.role === "admin"
                ? "rq-badge-admin"
                : user.role === "staff"
                    ? "rq-badge-staff"
                    : "rq-badge-community";"""

new_class_logic = """        const roleClass =
            user.role === "superadmin"
                ? "rq-badge-super"
                : user.role === "admin"
                    ? "rq-badge-admin"
                    : user.role === "staff"
                        ? "rq-badge-staff"
                        : "rq-badge-community";"""

content = content.replace(old_class_logic, new_class_logic)

# Replace roleText logic
old_text_logic = """        const roleText =
            user.role === "admin"
                ? "ADMIN"
                : user.role === "staff"
                    ? "STAFF"
                    : "USER";"""

new_text_logic = """        const roleText =
            user.role === "superadmin"
                ? "SUPER ADMIN"
                : user.role === "admin"
                    ? "ADMIN"
                    : user.role === "staff"
                        ? "STAFF"
                        : "USER";"""
                        
content = content.replace(old_text_logic, new_text_logic)

with open(js_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Updated admin-users.js")
