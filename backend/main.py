from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from schemas import BulkDeleteShiftsRequest, BulkDeleteTimeoffRequest, DepartmentWithManager, BulkDeleteDepartmentsRequest, BulkDeleteRequest, EmployeePublicResponse, LogResponse, TimeOffUpdate,TimeOffResponse,TimeOffCreate,EmployeeCreate, EmployeeResponse, EmployeeUpdate, LoginRequest, TokenResponse, ShiftResponse, ShiftCreate, ShiftUpdate, DepartmentCreate, DepartmentResponse, DepartmentUpdate
from models import Employee, Shift, Department, TimeOff
from auth import verify_password, create_token, get_current_user, require_role
from crud import delete_shifts, delete_timeoffs, get_logs, get_timeoff, update_timeoff,delete_timeoff,create_timeoff,get_timeoffs,create_employee, delete_employee, get_employee, get_employees, update_employee, get_employee_by_email, get_shifts, get_shifts_of_emp, delete_shift, create_shift, update_shift, update_department, delete_department, get_departments, create_department, get_department, delete_departments
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
version = "0.1"

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_headers=["*"],
    allow_credentials=True,
    allow_methods=["*"]
)


@app.get("/auth/me", response_model=EmployeeResponse)
def get_me(current_user: Employee = Depends(get_current_user)):
    return current_user


@app.post("/auth/login")
def login_(data : LoginRequest,db: Session = Depends(get_db)):
    print(data)
    emp = get_employee_by_email(db,data.email)
    if not emp:
        raise HTTPException(status_code=401, detail="Invalid Credentials")
    if not verify_password(data.password,emp.password_hash):
        raise HTTPException(status_code=401, detail="Invalid Credentials")
    token = create_token(emp.id,emp.role)
    return {"access_token":token}






 

@app.post("/employees", response_model=EmployeeResponse)
def create_employee_(
                    data: EmployeeCreate, 
                    db: Session = Depends(get_db),
                    user: Employee = Depends(require_role("manager","admin"))):
    return create_employee(db,data, user)

# Update your router to use the new limited response model
@app.get("/employees_public", response_model=list[EmployeePublicResponse])
def list_employees(
    db: Session = Depends(get_db),
    user: Employee = Depends(require_role("employee", "manager", "admin"))
):
    # Query your database as normal; FastAPI filters out everything else!
    return db.query(Employee).all()

@app.get("/employees", response_model=list[EmployeeResponse])
def list_employees(db: Session = Depends(get_db),
                   user: Employee = Depends(require_role("employee","manager","admin"))):
    return get_employees(db, user)

@app.get("/logs", response_model=list[LogResponse])
def _list_logs(db: Session = Depends(get_db),
                   user: Employee = Depends(require_role("employee","manager","admin"))):
    return get_logs(db)

@app.put("/employees/{employee_id}", response_model=EmployeeResponse)
def update_employee_(
    employee_id:int, 
    data:EmployeeUpdate, 
    db: Session = Depends(get_db),
    user: Employee = Depends(require_role("manager","admin"))):
    emp = update_employee(db,employee_id,data, user)
    if not emp:
        raise HTTPException(status_code=404,detail="Not found")
    return emp

@app.delete("/employees", response_model=list[EmployeeResponse])
def remove_employee(
                    employee_ids: BulkDeleteRequest, 
                    user: Employee = Depends(require_role("admin")),
                    db: Session = Depends(get_db)
                    ):
    return delete_employee(db, employee_ids.employee_ids, user)


@app.get("/employees/{employee_id}", response_model=EmployeeResponse)
def list_employee(
    employee_id:int,
    db: Session = Depends(get_db), 
    user: Employee = Depends(require_role("employee","manager","admin"))):
    emp = get_employee(db,employee_id)
    if not emp:
        raise HTTPException(status_code=404,detail="Employee not found")
    return emp





@app.get("/timeoffs", response_model=list[TimeOffResponse])
def _get_timeoffs(db: Session = Depends(get_db), user: Employee = Depends(get_current_user)):  
    return get_timeoffs(db,user)


@app.get("/timeoffs/{timeoff_id}", response_model=TimeOffResponse)
def _get_timeoff(timeoff_id: int, db: Session = Depends(get_db)):
    return get_timeoff(db, timeoff_id)

@app.post("/timeoffs", response_model=TimeOffResponse)
def _create_timeoff(data: TimeOffCreate, 
                    db : Session = Depends(get_db),
                    user: Employee = Depends(require_role("employee","manager","admin"))):
    timeoff = create_timeoff(db,data, user)
    if not timeoff:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST)  
    return timeoff

@app.delete("/timeoffs/{timeoff_id}")
def _delete_timeoff(timeoff_id: int, 
                  db : Session = Depends(get_db),
                  user: Employee = Depends(require_role("manager","admin"))):
    timeoff = delete_timeoff(db,timeoff_id, user)
    if not timeoff:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    return timeoff



@app.patch("/timeoffs/{timeoff_id}", response_model=TimeOffResponse)
def _update_timeoff(
    timeoff_id:int, 
    data:TimeOffUpdate, 
    db: Session = Depends(get_db),
    user: Employee = Depends(require_role("manager","admin"))):
    timeoff = update_timeoff(db,timeoff_id,data, user)
    if not timeoff:
        raise HTTPException(status_code=404,detail="Not found")
    return timeoff



@app.delete("/timeoffs", response_model=list[TimeOffResponse])
def _delete_timeoffs(
                    dep_ids: BulkDeleteTimeoffRequest, 
                    user: Employee = Depends(require_role("admin","manager")),
                    db: Session = Depends(get_db)
                    ):
    return delete_timeoffs(db, dep_ids.department_ids, user)


@app.get("/departments", response_model=list[DepartmentWithManager])
def _get_departments(db: Session = Depends(get_db)):
    return get_departments(db)


@app.get("/departments/{dep_id}", response_model=DepartmentResponse)
def _get_departments(dep_id: int, db: Session = Depends(get_db)):
    return get_department(db, dep_id)

@app.post("/departments", response_model=DepartmentResponse)
def _create_department(data: DepartmentCreate, db : Session = Depends(get_db)):
    dep = create_department(db,data)
    if not dep:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST) # duplicate
    return dep

@app.delete("/departments/{dep_id}")
def _delete_department(dep_id: int, 
                  db : Session = Depends(get_db),
                  user: Employee = Depends(require_role("manager","admin"))):
    dep = delete_department(db,dep_id, user)
    if not dep:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    return dep

@app.delete("/departments", response_model=list[DepartmentResponse])
def _delete_departments(
                    dep_ids: BulkDeleteDepartmentsRequest, 
                    user: Employee = Depends(require_role("admin")),
                    db: Session = Depends(get_db)
                    ):
    return delete_departments(db, dep_ids.department_ids, user)

@app.put("/departments/{dep_id}", response_model=DepartmentResponse)
def _update_department(
    dep_id:int, 
    data:DepartmentUpdate, 
    db: Session = Depends(get_db),
    user: Employee = Depends(require_role("manager","admin"))):
    dep = update_department(db,dep_id,data, user)
    if not dep:
        raise HTTPException(status_code=404,detail="Not found")
    return dep





@app.get("/shifts", response_model=list[ShiftResponse])
def list_shifts(db : Session = Depends(get_db), user: Employee = Depends(require_role("employee","manager","admin"))):
    return get_shifts(db,user)


@app.post("/shifts", response_model=ShiftResponse)
def _create_shift(data: ShiftCreate, 
                  db : Session = Depends(get_db),
                user: Employee = Depends(require_role("manager","admin"))):
    shift = create_shift(db,data, user)
    if not shift:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST) # duplicate
    return shift

@app.delete("/shifts/{shift_id}")
def _delete_shift(shift_id: int, 
                  db : Session = Depends(get_db),
                  user: Employee = Depends(require_role("manager","admin"))):
    shift = delete_shift(db,shift_id)
    if not shift:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    return shift

@app.delete("/shifts", response_model=list[ShiftResponse])
def _delete_shifts(
                    shift_ids: BulkDeleteShiftsRequest, 
                    user: Employee = Depends(require_role("admin")),
                    db: Session = Depends(get_db)
                    ):
    return delete_shifts(db, shift_ids.shift_ids, user)

@app.put("/shifts/{id}", response_model=ShiftResponse)
def _update_shift(
    id:int, 
    data:ShiftUpdate, 
    db: Session = Depends(get_db),
    user: Employee = Depends(require_role("manager","admin"))):
    shift = update_shift(db,id,data, user)
    if not shift:
        raise HTTPException(status_code=404,detail="Not found")
    return shift





@app.get("/")
def root():
    return [{"message":f"Employee Management App is running. Version:{version}"}]

@app.get("/ping")
def ping():
   return [{"result":"Hello world"}]