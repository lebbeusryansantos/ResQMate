import os

file_path = "backend/routes/users.py"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update UpdateUserRequest
old_model = """class UpdateUserRequest(BaseModel):
    first_name: str
    last_name: str
    email: str
    phone_number: str = ""
    emergency_contact_name: str = ""
    emergency_contact_number: str = ""
    role: str
    password: Optional[str] = None"""

new_model = """class UpdateUserRequest(BaseModel):
    first_name: str
    last_name: str
    email: str
    phone_number: str = ""
    emergency_contact_name: str = ""
    emergency_contact_number: str = ""
    role: Optional[str] = None
    password: Optional[str] = None"""
content = content.replace(old_model, new_model)

# 2. Replace update_user entirely
import re
# Find the start of update_user
start_idx = content.find("@router.put(\"/{user_id}\")")
# Find the start of delete_user
end_idx = content.find("@router.delete(\"/{user_id}\")")

if start_idx != -1 and end_idx != -1:
    old_update_user = content[start_idx:end_idx]
    
    new_update_user = """@router.put("/{user_id}")
def update_user(
    user_id: int,
    data: UpdateUserRequest,
    admin: dict = Depends(get_current_admin)
):

    if data.phone_number:
        if not data.phone_number.isdigit() or len(data.phone_number) != 11 or not data.phone_number.startswith("09"):
            raise HTTPException(status_code=400, detail="Phone number must be exactly 11 digits, start with 09, and contain no letters or spaces.")

    if data.emergency_contact_number:
        if not data.emergency_contact_number.isdigit() or len(data.emergency_contact_number) != 11 or not data.emergency_contact_number.startswith("09"):
            raise HTTPException(status_code=400, detail="Emergency contact number must be exactly 11 digits, start with 09, and contain no letters or spaces.")

    with engine.begin() as conn:

        # 1. Fetch existing user
        target_user = conn.execute(
            text("SELECT email, role FROM users WHERE user_id = :uid"),
            {"uid": user_id}
        ).fetchone()

        if not target_user:
            raise HTTPException(status_code=404, detail="User not found")
            
        # 2. Determine db_role
        # Protect superadmin@gmail.com
        if target_user.email == 'superadmin@gmail.com':
            db_role = 'superadmin'
        else:
            if not data.role or data.role.strip() == "":
                db_role = target_user.role
            else:
                role_map = {
                    "community_user": "community_user",
                    "community": "community_user",
                    "staff": "staff",
                    "admin": "admin",
                    "superadmin": "superadmin"
                }
                # Preserve original role if the role is unrecognized
                db_role = role_map.get(data.role, target_user.role)

        # 3. Check email uniqueness
        existing_email = conn.execute(
            text("SELECT user_id FROM users WHERE email = :email AND user_id != :uid"),
            {"email": data.email, "uid": user_id}
        ).fetchone()

        if existing_email:
            raise HTTPException(status_code=400, detail="Email already registered")

        # 4. Check phone uniqueness
        if data.phone_number:
            existing_phone = conn.execute(
                text("SELECT user_id FROM users WHERE phone_number = :phone_number AND phone_number != '' AND user_id != :uid"),
                {"phone_number": data.phone_number, "uid": user_id}
            ).fetchone()

            if existing_phone:
                raise HTTPException(status_code=400, detail="Phone number already registered")

        # 5. Execute Update
        if data.password:
            result = conn.execute(
                text(\"\"\"
                    UPDATE users
                    SET
                        first_name = :first_name,
                        last_name = :last_name,
                        email = :email,
                        role = :role,
                        phone_number = :phone_number,
                        emergency_contact_name = :emergency_contact_name,
                        emergency_contact_number = :emergency_contact_number,
                        password = :password
                    WHERE user_id = :user_id
                \"\"\"),
                {
                    "user_id": user_id,
                    "first_name": data.first_name,
                    "last_name": data.last_name,
                    "email": data.email,
                    "role": db_role,
                    "phone_number": data.phone_number,
                    "emergency_contact_name": data.emergency_contact_name,
                    "emergency_contact_number": data.emergency_contact_number,
                    "password": pwd_context.hash(data.password)
                }
            )
        else:
            result = conn.execute(
                text(\"\"\"
                    UPDATE users
                    SET
                        first_name = :first_name,
                        last_name = :last_name,
                        email = :email,
                        phone_number = :phone_number,
                        emergency_contact_name = :emergency_contact_name,
                        emergency_contact_number = :emergency_contact_number,
                        role = :role
                    WHERE user_id = :user_id
                \"\"\"),
                {
                    "user_id": user_id,
                    "first_name": data.first_name,
                    "last_name": data.last_name,
                    "email": data.email,
                    "phone_number": data.phone_number,
                    "emergency_contact_name": data.emergency_contact_name,
                    "emergency_contact_number": data.emergency_contact_number,
                    "role": db_role
                }
            )

    return {
        "message": "User updated successfully"
    }

# =========================
# DELETE USER
"""
    content = content.replace(old_update_user, new_update_user)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Updated update_user in users.py")
