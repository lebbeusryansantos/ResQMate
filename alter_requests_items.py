import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

# Load environment variables
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./resqmate.db")

engine = create_engine(DATABASE_URL)

def run_migration():
    with engine.begin() as conn:
        print("Checking for requested_items_summary column in assistance_requests...")
        
        # Check if columns exist
        result = conn.execute(text("PRAGMA table_info(assistance_requests)"))
        columns = [row[1] for row in result]
        
        if "requested_items_summary" not in columns:
            print("Adding requested_items_summary column...")
            conn.execute(text("ALTER TABLE assistance_requests ADD COLUMN requested_items_summary TEXT"))

        print("Migration complete!")

if __name__ == "__main__":
    run_migration()
