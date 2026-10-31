from passlib.context import CryptContext
from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, HTTPBearer, HTTPAuthorizationCredentials

from database import get_db
from models import Employee

import os

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

def require_role(*allowed_roles : str):
    def checker(current_user: Employee = Depends(get_current_user)) -> Employee:
        if current_user.role not in allowed_roles:
            raise HTTPException(status.HTTP_403_FORBIDDEN, 
                                detail=f"Requires roles: ({', '.join(allowed_roles)})"
                                )
        return current_user
    return checker

bearer_scheme = HTTPBearer()
def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
                     db: Session = Depends(get_db)) -> Employee:
    
    credentials_exception = HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                                          detail="Could not validate credentials",
                                          headers={"WWW-Authenticate":"Bearer"},)
    token = credentials.credentials
                     
    payload = decode_token(token)

    if payload is None:
        raise credentials_exception

    employee_id = payload.get("sub") #returns employee id as string

    if employee_id is None:
        raise credentials_exception

    employee = db.query(Employee).filter(Employee.id == int(employee_id)).first()

    if employee is None:
        raise credentials_exception
    
    return employee

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain:str, hashed: str) -> bool:
    return pwd_context.verify(plain,hashed) #extracts salt from hash, rehashes plain with salt and compares

def create_token(employee_id: int, role: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub":str(employee_id),
        "role":role,
        "exp":expire,
    }
    return jwt.encode(payload,SECRET_KEY,algorithm=ALGORITHM)

def decode_token(token: str) -> dict | None:
    try:
        payload = jwt.decode(token,SECRET_KEY,algorithms=[ALGORITHM]) #raises if signature wrong, token expired, token malformed
        return payload
    except JWTError:
        return None
