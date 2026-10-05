import os
from sqlalchemy import text
from dotenv import load_dotenv

load_dotenv()

def alter_requests_feedback():
    from backend.database import engine
    try:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE assistance_requests ADD COLUMN admin_feedback TEXT;"))
            print("Added admin_feedback column.")
    except Exception as e:
        print(f"Failed to add admin_feedback: {e}")

if __name__ == "__main__":
    alter_requests_feedback()
