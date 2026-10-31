from pydantic import BaseModel, EmailStr
from datetime import datetime, date, time

class LogCreate(BaseModel):
    user_id : int
    action : str
    entity_type : int
    entity_id : int
    description : str
    created_at : datetime

class LogResponse(BaseModel):
    id: int
    user_id: int | None = None
    action: str
    entity_type: str
    entity_id: int | None = None
    description: str
    created_at: datetime

    class Config:
        from_attributes = True  # Crucial Pydantic v2 ORM translation mapping rule

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token : str
    token_type: str = "bearer"

class BulkDeleteRequest(BaseModel):
    employee_ids: list[int]

class BulkDeleteDepartmentsRequest(BaseModel):
    department_ids: list[int]

class BulkDeleteTimeoffRequest(BaseModel):
    timeoff_ids: list[int]

class BulkDeleteShiftsRequest(BaseModel):
    shift_ids: list[int]

class EmployeeUpdate(BaseModel):
    first_name: str  | None = None
    last_name:str  | None = None
    phone_number:str | None = None
    password:str  | None = None
    email: EmailStr  | None = None
    role:str | None = None
    position:str | None = None
    hourly_rate:float | None = None
    department_id:int | None = None
    is_active: bool | None = None
  
class EmployeeCreate(BaseModel):

    first_name: str
    last_name:str
    phone_number:str | None = None
    password:str
    email: EmailStr
    role:str = "employee"
    position:str | None = None
    hourly_rate:float | None = None
    department_id:int | None = None

class ShiftCreate(BaseModel):
    employee_id: int
    shift_date: date
    start_time: time
    end_time: time
    notes: str | None = None

class ShiftUpdate(BaseModel):
    employee_id: int | None = None
    shift_date: date | None = None
    start_time: time | None = None
    end_time: time | None = None
    notes: str | None = None

class ShiftResponse(BaseModel):
    id: int
    employee_id: int
    shift_date: datetime
    start_time: time
    end_time: time
    notes: str | None = None
    class Config:
        from_attributes = True

class DepartmentCreate(BaseModel):
    name: str
    manager_id: int | None = None
        
class DepartmentResponse(BaseModel):
    id: int
    name: str
    manager_id : int | None = None
    class Config:
        from_attributes = True

class DepartmentUpdate(BaseModel):
    name: str
    manager_id : int | None = None

class TimeOffCreate(BaseModel):

    employee_id : int
    start_date : date
    end_date : date
    reason : str
    created_at : datetime

class TimeOffResponse(BaseModel):

    id : int
    employee_id : int
    start_date : date
    end_date : date
    reason : str
    status : str
    reviewed_by : int | None = None
    created_at : datetime
    class Config:
        from_attributes = True
class TimeOffUpdate(BaseModel):

    employee_id : int | None = None
    start_date : date | None = None
    end_date : date | None = None
    reason : str | None = None
    status : str | None = None
    reviewed_by : int | None = None


class DepartmentWithManager(DepartmentResponse):
    manager_name: str | None = None

    
class EmployeeResponse(BaseModel):

    id:int

    first_name: str
    last_name:str
    phone_number:str | None = None
    email: EmailStr
    role:str = "employee"
    position:str | None = None
    hourly_rate:float | None = None
    
    created_at:datetime | None = None

    department_id:int | None = None

    class Config:
        from_attributes = True

class EmployeePublicResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: EmailStr
    position: str | None = None
    department_id:int | None = None

    class Config:
        from_attributes = True