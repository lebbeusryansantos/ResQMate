import os
from sqlalchemy import text
from dotenv import load_dotenv

load_dotenv()
from backend.database import engine

def check_users():
    with engine.begin() as conn:
        print(conn.execute(text("SELECT user_id, email, role FROM users")).fetchall())

if __name__ == "__main__":
    check_users()
