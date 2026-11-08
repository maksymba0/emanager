import os
import pytest

# Set DATABASE_URL before importing anything that touches the DB
if not os.getenv("DATABASE_URL"):
    os.environ["DATABASE_URL"] = (
        "postgresql://test_user:test_password@localhost:5432/test_db"
    )

from fastapi.testclient import TestClient
from main import app
from database import SessionLocal, engine, Base
import models
from auth import hash_password


@pytest.fixture(scope="session", autouse=True)
def seed_database():
    # Ensure tables exist (main.py also does this, but be explicit)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        existing = (
            db.query(models.Employee)
            .filter(models.Employee.email == "admin@test.com")
            .first()
        )
        if not existing:
            admin = models.Employee(
                first_name="Test",
                last_name="Admin",
                email="admin@test.com",
                password_hash=hash_password("admin"),
                role="admin",
                is_active=True,
            )
            db.add(admin)
            db.commit()
    finally:
        db.close()

    yield


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c