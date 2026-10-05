import os
from backend.database import engine, Base
from backend.models.user import User
from backend.models.assistance_request import AssistanceRequest
from backend.models.category import Category
from backend.models.location import Location
from backend.models.resource import Resource
from backend.models.distribution import Distribution

def init_db():
    print("Creating tables in the SQLite database...")
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully!")

if __name__ == "__main__":
    init_db()
