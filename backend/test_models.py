from models import Employee, Shift, Department, TimeOff

print("All models imported successfully")
print(f"Department table: {Department.__tablename__}")
print(f"Employee table:   {Employee.__tablename__}")
print(f"Shift table:      {Shift.__tablename__}")
print(f"TimeOff table:    {TimeOff.__tablename__}")