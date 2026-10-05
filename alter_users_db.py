import os
from sqlalchemy import text
from dotenv import load_dotenv

load_dotenv()

def alter_users_db():
    from backend.database import engine
    try:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE users ADD COLUMN emergency_contact_name VARCHAR(100);"))
            print("Added emergency_contact_name column.")
    except Exception as e:
        print(f"Failed to add emergency_contact_name: {e}")

    try:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE users ADD COLUMN emergency_contact_number VARCHAR(20);"))
            print("Added emergency_contact_number column.")
    except Exception as e:
        print(f"Failed to add emergency_contact_number: {e}")

if __name__ == "__main__":
    alter_users_db()
