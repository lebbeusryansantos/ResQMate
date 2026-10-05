import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

# Load environment variables
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./resqmate.db")

engine = create_engine(DATABASE_URL)

def run_migration():
    with engine.begin() as conn:
        print("Checking for user_feedback columns in assistance_requests...")
        
        # Check if columns exist
        result = conn.execute(text("PRAGMA table_info(assistance_requests)"))
        columns = [row[1] for row in result]
        
        if "user_feedback" not in columns:
            print("Adding user_feedback column...")
            conn.execute(text("ALTER TABLE assistance_requests ADD COLUMN user_feedback TEXT"))
        
        if "feedback_rating" not in columns:
            print("Adding feedback_rating column...")
            conn.execute(text("ALTER TABLE assistance_requests ADD COLUMN feedback_rating INTEGER"))

        print("Migration complete!")

if __name__ == "__main__":
    run_migration()
