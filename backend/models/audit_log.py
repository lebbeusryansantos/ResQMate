from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
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
