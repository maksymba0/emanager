from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from logger import log_activity
from models import Employee, Log, Shift, Department, TimeOff
from schemas import EmployeeResponse,EmployeeCreate, ShiftResponse, DepartmentResponse,EmployeeUpdate, ShiftCreate, ShiftUpdate, DepartmentCreate, DepartmentUpdate, TimeOffCreate, TimeOffResponse, TimeOffUpdate
import hashlib
from auth import hash_password

def get_logs(db : Session , limit: int = 50):
    return db.query(Log).order_by(Log.created_at.desc()).limit(limit).all()


def create_timeoff(db: Session, data: TimeOffCreate, user : Employee):
    emp = db.query(Employee).filter(Employee.id == data.employee_id).first()

    if not emp:
        return None

    toff = db.query(TimeOff).filter(TimeOff.employee_id == data.employee_id, TimeOff.start_date == data.start_date).first() #prevent same name dep
    if toff:
        return None
    
    timeoff = TimeOff()
    timeoff.employee_id = data.employee_id
    timeoff.status = "pending"
    timeoff.created_at = data.created_at
    timeoff.end_date = data.end_date
    timeoff.reason = data.reason
    timeoff.reviewed_by = None
    timeoff.start_date = data.start_date

    db.add(timeoff)
    
    emp = db.query(Employee).filter(Employee.id == timeoff.employee_id).first()
    log_description = f"Created timeoff for {emp.first_name} {emp.last_name}"
    log_activity(
        db=db,
        user_id=user.id,
        action="create",
        entity_type="timeoff",
        entity_id=emp.id,
        # Populated smoothly by the flush check!
        description=log_description

    )
    db.commit()

    db.refresh(timeoff)

    return timeoff
def delete_timeoff(db : Session,id : int):
    timeoff = db.query(TimeOff).filter(TimeOff.id == id).first()
    if not timeoff:
        return None
    
    db.delete(timeoff)
    db.commit()

    return timeoff
def get_timeoffs(db : Session, user : Employee):
    if user.role == "employee":
        return db.query(TimeOff).filter(TimeOff.employee_id == user.id).all()
    return db.query(TimeOff).all()

def get_timeoff(db : Session, id: int):
    timeoff = db.query(TimeOff).filter(TimeOff.id == id).first()
    if not timeoff:
        return None
    return timeoff

def update_timeoff(db : Session,id : int,data : TimeOffUpdate, user : Employee):
    timeoff = db.query(TimeOff).filter(TimeOff.id == id).first()
        
    if not timeoff:
        return None

    # 2. Extract ONLY the fields sent by the frontend patch request
    # (If using Pydantic v1, swap this code layer for: data.dict(exclude_unset=True))
    update_data = data.model_dump(exclude_unset=True)

    # 3. Dynamic Attribute loop: Loops over fields like 'status' and 'reviewed_by'.
    # Because 'employee_id' wasn't sent, it is excluded from the loop and preserved!
    for key, value in update_data.items():
        setattr(timeoff, key, value)

    emp = db.query(Employee).filter(Employee.id == timeoff.employee_id).first()
    log_description = f"Updated timeoff for {emp.first_name} {emp.last_name}"
    log_activity(
        db=db,
        user_id=user.id,
        action="update",
        entity_type="timeoff",
        entity_id=emp.id,
        # Populated smoothly by the flush check!
        description=log_description

    )

    # 4. Save safely to database
    db.commit()
    db.refresh(timeoff) 

    return timeoff

def delete_timeoffs(db: Session, timeoff_ids: list[int], user : Employee):
    timeoffs_to_delete = db.query(TimeOff).filter(TimeOff.id.in_(timeoff_ids)).all()
    
    if not timeoffs_to_delete:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="No matching timeoff found to delete"
        )
    
    response_data = [TimeOffResponse.model_validate(timeoff) for timeoff in timeoffs_to_delete]
      
    # 2. Delete rows matching those entities
    for timeoff in timeoffs_to_delete:
        db.delete(timeoff)
        emp = db.query(Employee).filter(Employee.id == timeoff.employee_id).first()
        log_description = f"Deleted timeoff for {emp.first_name} {emp.last_name}"
        log_activity(
            db=db,
            user_id=user.id,
            action="delete",
            entity_type="timeoff",
            entity_id=emp.id,
            # Populated smoothly by the flush check!
            description=log_description

        )

    db.commit()




def create_department(db : Session,data : DepartmentCreate, user : Employee):

    dep = db.query(Department).filter(Department.name == data.name).first() #prevent same name dep
    if dep:
        return None
    
    dep = Department()
    dep.name = data.name
    dep.manager_id = data.manager_id


    db.add(dep)
    log_description = f"Created department {dep.name}"
    log_activity(
        db=db,
        user_id=user.id,
        action="create",
        entity_type="department",
        entity_id=None,
        # Populated smoothly by the flush check!
        description=log_description

    )
    db.commit()

    db.refresh(dep)

    return dep

def delete_department(db : Session,dep_id : int):
    dep = db.query(Department).filter(Department.id == dep_id).first()
    if not dep:
        return None
    
    db.delete(dep)
    db.commit()

    return dep
def delete_departments(db : Session,dep_ids : list[int], user : Employee):

    departments_to_delete = db.query(Department).filter(Department.id.in_(dep_ids)).all()
    if not departments_to_delete:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="No matching departments found to delete"
        )
    
    response_data = [DepartmentResponse.model_validate(dep) for dep in departments_to_delete]
      
    # 2. Delete rows matching those entities
    for dep in departments_to_delete:
        db.delete(dep)
        log_description = f"Deleted department {dep.name}"
        log_activity(
            db=db,
            user_id=user.id,
            action="delete",
            entity_type="department",
            # Populated smoothly by the flush check!
            description=log_description

        )

    db.commit()

    
    return response_data

def update_department(db : Session,dep_id : int,data : DepartmentUpdate, user : Employee):
    dep = db.query(Department).filter(Department.id == dep_id).first()
    if not dep:
        return None
    
    update_data = data.model_dump(exclude_unset=True)

    # 3. Securely update fields dynamically using setattr
    for key, value in update_data.items():
        setattr(dep, key, value)
 
    log_description = f"Updated department {dep.name}"
    log_activity(
        db=db,
        user_id=user.id,
        action="update",
        entity_type="department",
        entity_id=None,
         # Populated smoothly by the flush check!
        description=log_description

    )

    db.commit()
    db.refresh(dep)

    return dep

def get_departments(db : Session):
    departments = db.query(Department).all()

    manager_ids = [d.manager_id for d in departments if d.manager_id is not None]

    managers = db.query(Employee).filter(Employee.id.in_(manager_ids)).all() if manager_ids else []
    manager_map = {m.id: m for m in managers}

    result = []
    for dept in departments:
        manager = manager_map.get(dept.manager_id)
        result.append({
            "id": dept.id,
            "name": dept.name,
            "manager_id": dept.manager_id,
            "manager_name": f"{manager.first_name} {manager.last_name}" if manager else None,
        })
    
    return result

def get_department(db : Session, dep_id: int):
    dep = db.query(Department).filter(Department.id == dep_id).first()
    if not dep:
        return None
    return dep

def update_shift(db : Session,shift_id : int,data : ShiftUpdate, user : Employee):
    shift = db.query(Shift).filter(Shift.id == shift_id).first()
    
    if not shift:
        return None

    shift.employee_id = data.employee_id
    shift.start_time = data.start_time
    shift.end_time = data.end_time
    shift.notes = data.notes
    shift.shift_date = data.shift_date     

    emp = db.query(Employee).filter(Employee.id == shift.employee_id).first()
    log_description = f"Updated shift for {emp.first_name} {emp.last_name}"
    log_activity(
        db=db,
        user_id=user.id,
        action="update",
        entity_type="shift",
        entity_id=emp.id, # Populated smoothly by the flush check!
        description=log_description

    )

    db.commit()
    db.refresh(shift)

    return shift

def create_shift(db: Session, data: ShiftCreate, user : Employee):

    emp = db.query(Employee).filter(Employee.id == data.employee_id).first()
    if not emp:
        return None
    
    duplicate = db.query(Shift).filter(Shift.employee_id == data.employee_id, 
                           Shift.shift_date == data.shift_date,
                           Shift.end_time == data.end_time).first()
    if duplicate:
        return None
            
    shift = Shift()

    shift.employee_id = data.employee_id
    shift.end_time = data.end_time
    shift.start_time = data.start_time
    shift.shift_date = data.shift_date
    shift.notes = data.notes

    db.add(shift)

    emp = db.query(Employee).filter(Employee.id == shift.employee_id).first()
    log_description = f"Created shift for {emp.first_name} {emp.last_name}"
    log_activity(
        db=db,
        user_id=user.id,
        action="create",
        entity_type="shift",
        entity_id=emp.id, # Populated smoothly by the flush check!
        description=log_description

    )
    
    db.commit()

    db.refresh(shift)
    
    return shift

def delete_shift(db: Session, shift_id: int):
    shift = db.query(Shift).filter(Shift.id == shift_id).first()
    if not shift:
        return None
    db.delete(shift)
    db.commit()

    return shift
def delete_shifts(db: Session, shift_ids: list[int], user : Employee):
    shifts_to_delete = db.query(Shift).filter(Shift.id.in_(shift_ids)).all()
    
    if not shifts_to_delete:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="No matching shift found to delete"
        )
    
    response_data = [ShiftResponse.model_validate(shift) for shift in shifts_to_delete]
      
    # 2. Delete rows matching those entities
    for shift in shifts_to_delete:
        db.delete(shift)
        emp = db.query(Employee).filter(Employee.id == shift.employee_id).first()
        log_description = f"Deleted shift of {emp.first_name} {emp.last_name}"
        log_activity(
            db=db,
            user_id=user.id,
            action="delete",
            entity_type="shift",
            entity_id=emp.id, # Populated smoothly by the flush check!
            description=log_description

        )
    db.commit()

    
    return response_data
def get_shifts(db: Session, user : Employee, skip=0,limit=100):
    if user.role == "employee":
        return db.query(Shift).filter(Shift.employee_id == user.id).offset(skip).limit(limit).all()
    return db.query(Shift).offset(skip).limit(limit).all()

def get_shifts_of_emp(db: Session, employee_id: int):
    return db.query(Shift).filter(Shift.employee_id == employee_id).all()




def get_employee_by_email(db: Session, email: str) -> Employee:
    return db.query(Employee).filter(Employee.email == email).first()

def get_employees(db:Session, user : Employee, skip=0,limit=100):
    return db.query(Employee).offset(skip).limit(limit).all()

def get_employee(db:Session, employee_id:int):
    return db.query(Employee).filter(Employee.id == employee_id).first()

def delete_employee(db:Session, employee_ids:list[int], user : Employee):

    employees_to_delete = db.query(Employee).filter(Employee.id.in_(employee_ids)).all()
    if not employees_to_delete:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="No matching employees found to delete"
        )
    
    response_data = [EmployeeResponse.model_validate(emp) for emp in employees_to_delete]

    # 1. Delete fully-owned records
    db.query(TimeOff).filter(TimeOff.employee_id.in_(employee_ids)).delete(synchronize_session=False)
    db.query(Shift).filter(Shift.employee_id.in_(employee_ids)).delete(synchronize_session=False)
    
    # 2. Null out references that should survive
    db.query(TimeOff).filter(TimeOff.reviewed_by.in_(employee_ids))\
        .update({TimeOff.reviewed_by: None}, synchronize_session=False)
    db.query(Department).filter(Department.manager_id.in_(employee_ids))\
        .update({Department.manager_id: None}, synchronize_session=False)



    # 2. Delete rows matching those entities
    for emp in employees_to_delete:
        db.delete(emp,synchronize_session=False)
        log_description = f"Deleted employee {emp.first_name} {emp.last_name}"
        log_activity(
            db=db,
            user_id=user.id,
            action="delete",
            entity_type="employee",
            entity_id=emp.id, # Populated smoothly by the flush check!
            description=log_description
        )

    db.commit()

    return response_data

def update_employee(db: Session, employee_id:int, data: EmployeeUpdate, user: Employee):
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        return None

    if data.password:
        password_hash_ = hash_password(data.password)
        emp.password_hash = password_hash_
    emp.first_name = data.first_name
    emp.last_name = data.last_name
    emp.phone_number = data.phone_number
    emp.position = data.position
    emp.department_id = data.department_id
    emp.email = data.email
    emp.hourly_rate = data.hourly_rate
    emp.is_active = data.is_active
    emp.role = data.role

    log_description = f"Updated employee {emp.first_name} {emp.last_name}"
    log_activity(
        db=db,
        user_id=user.id,
        action="update",
        entity_type="employee",
        entity_id=emp.id, # Populated smoothly by the flush check!
        description=log_description
    )

    db.commit()
    db.refresh(emp)

    return emp

def create_employee(db: Session, data: EmployeeCreate, user: Employee):
    password_hash = hash_password(data.password)

    db_employee = Employee(
        first_name = data.first_name,
        last_name = data.last_name,
        phone_number = data.phone_number,
        password_hash = password_hash,
        email = data.email,

        role = data.role,
        position = data.position,
        hourly_rate = data.hourly_rate,
        department_id = data.department_id
    )

    existing = db.query(Employee).first()

    if not existing:
        db_employee.role = "admin" #if table is emppty, make first user admin. like in nature


    db.add(db_employee)
    log_description = f"Created employee {db_employee.first_name} {db_employee.last_name}"
    log_activity(
        db=db,
        user_id=user.id,
        action="create",
        entity_type="employee",
        entity_id=db_employee.id, # Populated smoothly by the flush check!
        description=log_description
    )
    db.commit()

    db.refresh(db_employee) #we can get  the ID and created_at from db

    return db_employee


