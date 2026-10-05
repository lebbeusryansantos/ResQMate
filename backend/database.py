import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./resqmate.db")

connect_args = {}
if "ssl-mode" in DATABASE_URL:
    import urllib.parse
    parsed = urllib.parse.urlparse(DATABASE_URL)
    query = urllib.parse.parse_qs(parsed.query)
    query.pop('ssl-mode', None)
    new_query = urllib.parse.urlencode(query, doseq=True)
    DATABASE_URL = urllib.parse.urlunparse(parsed._replace(query=new_query))
    connect_args = {"ssl": {}}

engine = create_engine(DATABASE_URL, connect_args=connect_args)

try:
    with engine.connect() as conn:
        print("Successfully connected to the database.")
except Exception as e:
    print(f"Error connecting to the database: {e}")
    # Optional: we can raise or let it fail later
    # raise e

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()