import os

file_path = "backend/routes/users.py"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace the first variant
old_map_1 = """    role_map = {
        "community_user": "community_user",
        "community":      "community_user",
        "staff":          "staff",
        "admin":          "admin"
    }"""
new_map_1 = """    role_map = {
        "community_user": "community_user",
        "community":      "community_user",
        "staff":          "staff",
        "admin":          "admin",
        "superadmin":     "superadmin"
    }"""

# Replace the second variant
old_map_2 = """    role_map = {
        "community_user": "community_user",
        "community": "community_user",
        "staff": "staff",
        "admin": "admin"
    }"""
new_map_2 = """    role_map = {
        "community_user": "community_user",
        "community": "community_user",
        "staff": "staff",
        "admin": "admin",
        "superadmin": "superadmin"
    }"""

content = content.replace(old_map_1, new_map_1)
content = content.replace(old_map_2, new_map_2)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Updated role_map in users.py")
