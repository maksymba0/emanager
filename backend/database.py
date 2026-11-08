import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

load_dotenv()

# 1. Prefer DATABASE_URL (CI / Render / production)
DATABASE_URL = os.getenv("DATABASE_URL")

# 2. Fall back to local dev (Docker on port 5433)
if not DATABASE_URL:
    USER = os.getenv("POSTGRES_USER")
    PASSWORD = os.getenv("POSTGRES_PASSWORD")
    DB = os.getenv("POSTGRES_DB")
    DATABASE_URL = f"postgresql://{USER}:{PASSWORD}@localhost:5433/{DB}"

engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    print(f"DEBUG: get_db yielded {type(db)}")
    try:
        yield db
    finally:
        db.close()