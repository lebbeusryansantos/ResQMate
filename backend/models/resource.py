from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from backend.database import Base

class Resource(Base):
    __tablename__ = "resources"

    resource_id        = Column(Integer, primary_key=True, index=True)
    resource_name      = Column(String(100))
    category           = Column(String(50))          # food / water / shelter / medicine / other
    quantity_available = Column(Integer)
    unit               = Column(String(50))
    location           = Column(String(150))         # warehouse/depot name
    status             = Column(String(50), default="Available")
    last_updated       = Column(DateTime, server_default=func.now(), onupdate=func.now())
    max_stock = Column(
    Integer,
    nullable=False,
    default=100
)
