import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text, inspect

# Load environment variables
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./resqmate.db")

engine = create_engine(DATABASE_URL)

def run_migration():
    with engine.begin() as conn:
        print("Checking for requested_items_summary column in assistance_requests...")
        
        # Check if columns exist
        inspector = inspect(conn)
        columns = [col['name'] for col in inspector.get_columns('assistance_requests')]
        
        if "requested_items_summary" not in columns:
            print("Adding requested_items_summary column...")
            conn.execute(text("ALTER TABLE assistance_requests ADD COLUMN requested_items_summary TEXT"))

        print("Migration complete!")

if __name__ == "__main__":
    run_migration()
