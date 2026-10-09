from sqlalchemy import text
from backend.database import engine

def log_audit(user: dict, action_description: str):
    user_id = user["user_id"]
    user_role = user["role"]
    
    try:
        with engine.begin() as conn:
            # Fetch user name
            result = conn.execute(
                text("SELECT full_name FROM users WHERE user_id = :uid"),
                {"uid": user_id}
            ).fetchone()
            
            user_name = result.full_name if result else "Unknown User"
            
            conn.execute(
                text("""
                    INSERT INTO audit_logs (user_id, user_name, user_role, action_description, timestamp)
                    VALUES (:uid, :uname, :urole, :action, CURRENT_TIMESTAMP)
                """),
                {
                    "uid": user_id,
                    "uname": user_name,
                    "urole": user_role,
                    "action": action_description
                }
            )
    except Exception as e:
        print(f"Audit log failed: {e}")
