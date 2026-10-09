import os
import re

# 1. Create audit_log.py model
models_dir = 'backend/models'
os.makedirs(models_dir, exist_ok=True)
audit_log_code = """from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from backend.database import Base
import datetime

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    user_name = Column(String(100), nullable=False)
    user_role = Column(String(50), nullable=False)
    action_description = Column(String(255), nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
"""
with open(os.path.join(models_dir, 'audit_log.py'), 'w', encoding='utf-8') as f:
    f.write(audit_log_code)

# 2. Add to main.py
main_py_path = 'backend/main.py'
with open(main_py_path, 'r', encoding='utf-8') as f:
    main_content = f.read()

if 'from backend.models.audit_log import AuditLog' not in main_content:
    main_content = main_content.replace(
        'from backend.models.request_status_history import RequestStatusHistory',
        'from backend.models.request_status_history import RequestStatusHistory\nfrom backend.models.audit_log import AuditLog'
    )
    main_content = main_content.replace(
        'from backend.routes.history import router as history_router',
        'from backend.routes.history import router as history_router\nfrom backend.routes.audit_logs import router as audit_logs_router'
    )
    main_content = main_content.replace(
        'app.include_router(history_router, prefix="/api/history", tags=["History"])',
        'app.include_router(history_router, prefix="/api/history", tags=["History"])\napp.include_router(audit_logs_router, prefix="/api/audit_logs", tags=["Audit Logs"])'
    )
    with open(main_py_path, 'w', encoding='utf-8') as f:
        f.write(main_content)

# 3. Add to security.py
sec_path = 'backend/security.py'
with open(sec_path, 'r', encoding='utf-8') as f:
    sec_content = f.read()

if 'get_current_superadmin' not in sec_content:
    sec_content += "\n\ndef get_current_superadmin(user: dict = Depends(require_role([\"superadmin\"]))):\n    return user\n"
    with open(sec_path, 'w', encoding='utf-8') as f:
        f.write(sec_content)

print("Models and security updated.")
