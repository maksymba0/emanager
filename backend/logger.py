from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.orm import Session
from sqlalchemy.ext.declarative import declarative_base
import datetime

Base = declarative_base()

# 1. Define the Activity Log Database Model
class ActivityLog(Base):
    __tablename__ = "activity_log"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True) # ID of the admin/manager performing the action
    action = Column(String(20), nullable=False) # 'create', 'update', 'delete'
    entity_type = Column(String(20), nullable=False) # 'employee', 'department', etc.
    entity_id = Column(Integer, nullable=True)
    description = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

# 2. Reusable logging worker function
def log_activity(
    db: Session, 
    user_id: int | None, 
    action: str, 
    entity_type: str, 
    entity_id: int | None, 
    description: str
):
    log_entry = ActivityLog(
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        description=description
    )
    db.add(log_entry)
    # Note: Do NOT call db.commit() here! 
    # Let your main CRUD functions commit everything together as a single atomic transaction.
