from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from sqlalchemy import text
from backend.database import engine
import secrets
import jwt
import os
from datetime import datetime, timedelta, timezone
from backend.security import get_current_user, get_current_admin
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

router = APIRouter()


# =========================
# CHECK EMAIL
# =========================

@router.get("/check-email")
def check_email(email: str):
    with engine.connect() as conn:
        existing = conn.execute(
            text("SELECT user_id FROM users WHERE email = :email"),
            {"email": email}
        ).fetchone()
        
    if existing:
        return {"exists": True}
    return {"exists": False}


# =========================
# REQUEST MODELS
# =========================

class RegisterRequest(BaseModel):
    first_name:   str
    last_name:    str
    email:        str
    password:     str
    phone_number: str = ""
    dob:          str = "2000-01-01"
    role:         str = "community_user"   # fixed: must match DB enum


class LoginRequest(BaseModel):
    email:    str
    password: str


class UpdateUserRequest(BaseModel):
    first_name: str
    last_name: str
    email: str
    role: str
    password: Optional[str] = None


class CreateUserRequest(BaseModel):
    """Used by admin Add-User modal (full_name split here)."""
    full_name: str
    email:     str
    password:  str = "ResQMate2024!"   # temp default
    role:      str = "community_user"


# =========================
# GET ALL USERS
# =========================

@router.get("/")
def get_users(admin: dict = Depends(get_current_admin)):

    with engine.connect() as conn:

        result = conn.execute(
            text("""
                SELECT
                    user_id,
                    CONCAT_WS(' ', first_name, last_name) AS full_name,
                    email,
                    role
                FROM users
            """)
        )

        users = []
        for row in result:
            users.append({
                "user_id":   row.user_id,
                "full_name": row.full_name,
                "email":     row.email,
                "role":      row.role
            })

    return users


# =========================
# REGISTER USER (public signup)
# =========================

@router.post("/register")
def register_user(data: RegisterRequest):

    # Map display role to DB enum value
    role_map = {
        "community_user": "community_user",
        "community":      "community_user",
        "staff":          "staff",
        "admin":          "admin"
    }
    db_role = role_map.get(data.role, "community_user")

    if " " in data.email:
        raise HTTPException(status_code=400, detail="Email address must not contain spaces.")

    with engine.begin() as conn:

        existing = conn.execute(
            text("SELECT user_id FROM users WHERE email = :email"),
            {"email": data.email}
        ).fetchone()

        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")

        result = conn.execute(
            text("""
                INSERT INTO users
                    (first_name, last_name, email, password, role, phone_number, dob)
                VALUES
                    (:first_name, :last_name, :email, :password, :role, :phone_number, :dob)
            """),
            {
                "first_name":   data.first_name,
                "last_name":    data.last_name,
                "email":        data.email,
                "password":     pwd_context.hash(data.password),
                "role":         db_role,
                "phone_number": data.phone_number,
                "dob":          data.dob
            }
        )

        user_id = result.lastrowid

    return {
        "message":    "User registered successfully",
        "user_id":    user_id,
        "first_name": data.first_name,
        "last_name":  data.last_name,
        "full_name":  f"{data.first_name} {data.last_name}",
        "email":      data.email,
        "role":       db_role
    }


# =========================
# CREATE USER (admin panel)
# Accepts full_name and splits it
# =========================

@router.post("/create")
def create_user(data: CreateUserRequest, admin: dict = Depends(get_current_admin)):

    role_map = {
        "community_user": "community_user",
        "community":      "community_user",
        "staff":          "staff",
        "admin":          "admin"
    }
    db_role = role_map.get(data.role, "community_user")

    parts      = data.full_name.strip().split(" ", 1)
    first_name = parts[0]
    last_name  = parts[1] if len(parts) > 1 else ""

    with engine.begin() as conn:

        existing = conn.execute(
            text("SELECT user_id FROM users WHERE email = :email"),
            {"email": data.email}
        ).fetchone()

        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")

        result = conn.execute(
            text("""
                INSERT INTO users
                    (first_name, last_name, email, password, role, phone_number, dob)
                VALUES
                    (:first_name, :last_name, :email, :password, :role, '', '2000-01-01')
            """),
            {
                "first_name": first_name,
                "last_name":  last_name,
                "email":      data.email,
                "password":   pwd_context.hash(data.password),
                "role":       db_role
            }
        )

        user_id = result.lastrowid

    return {
        "message":  "User created successfully",
        "user_id":  user_id,
        "full_name": data.full_name,
        "email":    data.email,
        "role":     db_role
    }


# =========================
# LOGIN USER
# =========================

@router.post("/login")
def login_user(data: LoginRequest):

    print("===== LOGIN ATTEMPT =====")
    print("Email:", data.email)

    if " " in data.email:
        raise HTTPException(
            status_code=400,
            detail={"error": "Email address must not contain spaces."}
        )

    JWT_SECRET = os.getenv("JWT_SECRET", "supersecretkey")

    with engine.connect() as conn:
        result = conn.execute(
            text("""
                SELECT
                    user_id,
                    CONCAT_WS(' ', first_name, last_name) AS full_name,
                    email,
                    password,
                    role,
                    failed_login_attempts,
                    locked_until
                FROM users
                WHERE email = :email
            """),
            {"email": data.email}
        ).fetchone()

    print("User found:", result is not None)

    if result:
        print("User ID:", result.user_id)
        print("Role:", result.role)
        print("Stored Password Hash:", result.password)

    if not result:
        raise HTTPException(
            status_code=401,
            detail={"error": "Invalid email or password"}
        )
    JWT_SECRET = os.getenv("JWT_SECRET", "supersecretkey")

    with engine.connect() as conn:

        result = conn.execute(
            text("""
                SELECT
                    user_id,
                    CONCAT_WS(' ', first_name, last_name) AS full_name,
                    email,
                    password,
                    role,
                    failed_login_attempts,
                    locked_until
                FROM users
                WHERE email = :email
            """),
            {"email": data.email}
        ).fetchone()

    if not result:
        raise HTTPException(status_code=401, detail={"error": "Invalid email or password"})

    # Check for lockout
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    if result.locked_until and result.locked_until > now:
        raise HTTPException(status_code=403, detail={"error": "Account locked due to too many failed attempts.", "attempts_remaining": 0, "locked_until": result.locked_until.isoformat()})

    try:
        is_valid = pwd_context.verify(data.password, result.password)
    except Exception:
        is_valid = (result.password == data.password)

    if not is_valid:
        failed_attempts = (result.failed_login_attempts or 0) + 1
        with engine.begin() as conn:
            if failed_attempts >= 3:
                lockout_time = now + timedelta(minutes=3)
                conn.execute(
                    text("UPDATE users SET failed_login_attempts = :attempts, locked_until = :lock_time WHERE user_id = :uid"),
                    {"attempts": failed_attempts, "lock_time": lockout_time, "uid": result.user_id}
                )
                raise HTTPException(status_code=403, detail={"error": "Too many failed attempts. Account locked for 3 minutes.", "attempts_remaining": 0, "locked_until": lockout_time.isoformat()})
            else:
                conn.execute(
                    text("UPDATE users SET failed_login_attempts = :attempts WHERE user_id = :uid"),
                    {"attempts": failed_attempts, "uid": result.user_id}
                )
        attempts_remaining = 3 - failed_attempts
        raise HTTPException(status_code=401, detail={"error": "Invalid email or password", "attempts_remaining": attempts_remaining})

    # Generate JWT session token
    exp_time = now + timedelta(hours=24)
    payload = {
        "sub": str(result.user_id),
        "role": result.role,
        "exp": exp_time
    }
    session_token = jwt.encode(payload, JWT_SECRET, algorithm="HS256")
    
    with engine.begin() as conn:
        conn.execute(
            text("UPDATE users SET session_token = :token, failed_login_attempts = 0, locked_until = NULL WHERE user_id = :uid"),
            {"token": session_token, "uid": result.user_id}
        )

    return {
        "message":  "Login successful",
        "user_id":  result.user_id,
        "full_name": result.full_name,
        "email":    result.email,
        "role":     result.role,
        "token":    session_token
    }

# =========================
# LOGOUT USER
# =========================

@router.post("/logout")
def logout_user(user: dict = Depends(get_current_user)):
    with engine.begin() as conn:
        conn.execute(
            text("UPDATE users SET session_token = NULL WHERE user_id = :uid"),
            {"uid": user["user_id"]}
        )
    return {"message": "Logged out successfully"}


# =========================
# UPDATE USER
# =========================
@router.put("/{user_id}")
def update_user(
    user_id: int,
    data: UpdateUserRequest,
    admin: dict = Depends(get_current_admin)
):

    role_map = {
        "community_user": "community_user",
        "community": "community_user",
        "staff": "staff",
        "admin": "admin"
    }

    db_role = role_map.get(data.role, "community_user")

    with engine.begin() as conn:

        if data.password:

            result = conn.execute(
                text("""
                    UPDATE users
                    SET
                        first_name = :first_name,
                        last_name = :last_name,
                        email = :email,
                        role = :role,
                        password = :password
                    WHERE user_id = :user_id
                """),
                {
                    "user_id": user_id,
                    "first_name": data.first_name,
                    "last_name": data.last_name,
                    "email": data.email,
                    "role": db_role,
                    "password": pwd_context.hash(data.password)
                }
            )

        else:

            result = conn.execute(
                text("""
                    UPDATE users
                    SET
                        first_name = :first_name,
                        last_name = :last_name,
                        email = :email,
                        role = :role
                    WHERE user_id = :user_id
                """),
                {
                    "user_id": user_id,
                    "first_name": data.first_name,
                    "last_name": data.last_name,
                    "email": data.email,
                    "role": db_role
                }
            )

        if result.rowcount == 0:
            raise HTTPException(
                status_code=404,
                detail="User not found"
            )

    return {
        "message": "User updated successfully"
    }

    role_map = {
        "community_user": "community_user",
        "community":      "community_user",
        "staff":          "staff",
        "admin":          "admin"
    }
    db_role = role_map.get(data.role, "community_user")

    with engine.begin() as conn:

        result = conn.execute(
            text("""
                UPDATE users
                SET
                    first_name = :first_name,
                    last_name  = :last_name,
                    email      = :email,
                    role       = :role
                WHERE user_id = :user_id
            """),
            {
                "user_id":    user_id,
                "first_name": data.first_name,
                "last_name":  data.last_name,
                "email":      data.email,
                "role":       db_role
            }
        )

        if result.rowcount == 0:
            raise HTTPException(status_code=404, detail="User not found")

    return {"message": "User updated successfully"}


# =========================
# DELETE USER
# =========================

@router.delete("/{user_id}")
def delete_user(user_id: int, admin: dict = Depends(get_current_admin)):

    with engine.begin() as conn:

        result = conn.execute(
            text("DELETE FROM users WHERE user_id = :user_id"),
            {"user_id": user_id}
        )

        if result.rowcount == 0:
            raise HTTPException(status_code=404, detail="User not found")

    return {"message": "User deleted successfully"}
