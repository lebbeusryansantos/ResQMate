import os
from sqlalchemy import text
from dotenv import load_dotenv

load_dotenv()

def alter_db():
    from backend.database import engine
    try:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE assistance_requests ADD COLUMN calamity_type VARCHAR(255);"))
            print("Added calamity_type column.")
    except Exception as e:
        print(f"Failed to add calamity_type: {e}")

    try:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE assistance_requests ADD COLUMN specific_address TEXT;"))
            print("Added specific_address column.")
    except Exception as e:
        print(f"Failed to add specific_address: {e}")

if __name__ == "__main__":
    alter_db()
