from sqlalchemy import Column, Integer, String, Enum, DateTime
from sqlalchemy.sql import func
from backend.database import Base

class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(50), nullable=False)
    last_name = Column(String(50), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    password = Column(String(255), nullable=False)

    role = Column(
        Enum(
            "community_user",
            "staff",
            "admin",
            name="user_role_enum"
        )
    )

    date_created = Column(
        DateTime,
        server_default=func.now()
    )
    phone_number = Column(String(20))
    dob = Column(DateTime)
    session_token = Column(String(255), nullable=True)
    failed_login_attempts = Column(Integer, default=0)
    locked_until = Column(DateTime, nullable=True)