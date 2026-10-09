from fastapi import APIRouter, Depends
from sqlalchemy import text
from backend.database import engine
from backend.security import get_current_superadmin

router = APIRouter()

@router.get("/")
def get_audit_logs(admin: dict = Depends(get_current_superadmin)):
    with engine.connect() as conn:
        result = conn.execute(text("SELECT id, user_id, user_name, user_role, action_description, timestamp FROM audit_logs ORDER BY timestamp DESC"))
        logs = []
        for row in result:
            logs.append({
                "id": row.id,
                "user_id": row.user_id,
                "user_name": row.user_name,
                "user_role": row.user_role,
                "action_description": row.action_description,
                "timestamp": str(row.timestamp)
            })
        return logs
