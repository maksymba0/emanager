import os

# If DATABASE_URL is not provided (e.g. local run without .env),
# fall back to the CI postgres service.
if not os.getenv("DATABASE_URL"):
    os.environ["DATABASE_URL"] = (
        "postgresql://test_user:test_password@localhost:5432/test_db"
    )