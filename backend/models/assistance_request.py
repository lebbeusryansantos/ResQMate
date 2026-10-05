from sqlalchemy import (
    Column,
    Integer,
    Text,
    String,
    ForeignKey,
    Enum,
    DateTime
)
from sqlalchemy.sql import func
from backend.database import Base

class AssistanceRequest(Base):
    __tablename__ = "assistance_requests"

    request_id = Column(Integer, primary_key=True, index=True)
    user_id    = Column(Integer, ForeignKey("users.user_id"))
    category_id= Column(Integer, ForeignKey("categories.category_id"))
    location_id= Column(Integer, ForeignKey("locations.location_id"))
    request_details = Column(Text)

    priority_level = Column(
        Enum("low", "medium", "high", "critical", name="priority_level_enum"),
        default="medium"
    )

    status = Column(String(50), default="pending")

    # Added: admin fills this when rejecting
    rejection_reason = Column(Text, nullable=True)

    calamity_type = Column(String(255), nullable=True)
    specific_address = Column(Text, nullable=True)

    date_requested = Column(DateTime, server_default=func.now())
