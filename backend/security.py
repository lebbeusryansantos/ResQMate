import os
import jwt
from fastapi import Request, HTTPException, Depends
from sqlalchemy import text
from backend.database import engine

JWT_SECRET = os.getenv("JWT_SECRET", "supersecretkey")

def get_session_token(request: Request):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    return auth_header.split(" ")[1]

def get_current_user(token: str = Depends(get_session_token)):
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token payload")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Session expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

    with engine.connect() as conn:
        result = conn.execute(
            text("SELECT user_id, role, session_token FROM users WHERE session_token = :token"),
            {"token": token}
        ).fetchone()
        
        if not result:
            raise HTTPException(status_code=401, detail="Invalid session or logged out")
            
        return {"user_id": result.user_id, "role": result.role}

def require_role(allowed_roles: list[str]):
    def role_checker(user: dict = Depends(get_current_user)):
        if user["role"] not in allowed_roles:
            raise HTTPException(status_code=403, detail="Forbidden: insufficient permissions")
        return user
    return role_checker

def get_current_admin(user: dict = Depends(require_role(["admin"]))):
    return user

def get_current_staff(user: dict = Depends(require_role(["staff"]))):
    return user

def get_current_customer(user: dict = Depends(require_role(["community_user"]))):
    return user


def get_current_superadmin(user: dict = Depends(require_role(["superadmin"]))):
    return user
