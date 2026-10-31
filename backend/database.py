from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv
import os

load_dotenv()

USER = os.getenv("POSTGRES_USER")
PASSWORD = os.getenv("POSTGRES_PASSWORD")
DB = os.getenv("POSTGRES_DB")
 
DATABASE_URL = f"postgresql://{USER}:{PASSWORD}@localhost:5433/{DB}?client_encoding=utf8"

print(f"USER: {repr(USER)}")
print(f"PASSWORD: {repr(PASSWORD)}")
print(f"DB: {repr(DB)}")
print(f"URL: {repr(DATABASE_URL)}")

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