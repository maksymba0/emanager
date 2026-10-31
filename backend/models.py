from sqlalchemy import (
    Date, Time, Integer, Text, 
    ForeignKey, DECIMAL, TIMESTAMP, Column, 
    String, Boolean)

from database import Base
from sqlalchemy import func

class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer,primary_key=True)
    name = Column(String(30),nullable=False)
    manager_id = Column(Integer)


class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True)

    first_name = Column(String(20), nullable=False) 
    last_name = Column(String(25), nullable=False)
    phone_number = Column(String(15))
    password_hash = Column(String(256), nullable=False)
    email = Column(String(50), nullable=False, unique=True)

    role = Column(String(20), default='employee')
    position = Column(String(30))
    hourly_rate = Column(DECIMAL(10,2))

    is_active = Column(Boolean,default=False)
    created_at = Column(TIMESTAMP,server_default=func.now())

    department_id = Column(Integer)             

class Shift(Base):
    __tablename__ = "shifts"

    id = Column(Integer, primary_key=True)
    employee_id = Column(Integer, nullable=False)

    shift_date = Column(Date, nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)

    notes = Column(String(30))

class TimeOff(Base):
    __tablename__ = "timeoffs"

    id = Column(Integer, primary_key=True)
    employee_id = Column(Integer, ForeignKey('employees.id'),nullable=False)

    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)

    reason = Column(String(100))
    status = Column(String(15),server_default='pending')
    reviewed_by = Column(Integer, nullable=True)
    created_at = Column(TIMESTAMP,server_default=func.now())

class Log(Base):
    __tablename__ = "activity_log"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('employees.id'),nullable=False)
    action = Column(String, nullable=False)
    entity_type = Column(String, nullable=False)

    entity_id = Column(Integer)
    description = Column(String(60))
    created_at = Column(TIMESTAMP,server_default=func.now())