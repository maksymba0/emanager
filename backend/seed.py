from database import SessionLocal
from auth import hash_password
from models import Employee

def seed():
    db = SessionLocal()
    try:
        if db.query(Employee).first():
            print("Database already has employees. Skipping seed.")
            return
        
        admin = Employee(
            first_name="Admin",
            last_name="User",
            email="admin@test.com",
            password_hash=hash_password("admin"),
            role="admin",
            is_active=True,
        )
        db.add(admin)
        db.commit()
        print("Created first admin: admin@test.com / admin")
        print("Change this password immediately.")
    finally:
        db.close()

if __name__ == "__main__":
    seed()