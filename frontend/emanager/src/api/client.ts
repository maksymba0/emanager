

const API_URL = "http://127.0.0.1:8000";

export interface Employee {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string | null;
    role: string;
    position: string | null;
    hourly_rate: number | null;
    is_active: boolean;
    created_at: string;
    department_id: number | null;
}

export interface Shift
{
    id: number
    employee_id: number| null
    shift_date: string| null
    start_time: string| null
    end_time: string| null
    notes: string | null
}
export interface Department {
    id: number
    name: string
    manager_id : number | null
}

// Mock interface to show manager names in the table view
export interface DepartmentWithManager extends Department {
    manager_name?: string | null;
}

export interface Timeoff
{
    id : number
    employee_id : number
    start_date : string
    end_date : string
    reason : string
    status : string
    reviewed_by : number | null
    created_at : string
}

export interface Log {
    id: number;
    user_id: number | null;
    action: string;
    entity_type: string; // Changed from number to string to match backend schema rules
    entity_id: number | null;
    description: string;
    created_at: string; // ISO DateTime string
}

export async function getLogs(): Promise<Log[]> {
    const token = getToken();
    const response = await fetch(`${API_URL}/logs`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
    });
    
    if (!response.ok) {
        throw new Error("Failed to retrieve operations updates");
    }
    
    return response.json();
}

export async function getTimeoffs()
{
    const token = getToken();
    const response = await fetch(`${API_URL}/timeoffs`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
    });
    
    if (!response.ok) {
        throw new Error("Not authenticated");
    }
    
    return response.json();
}
export async function createTimeoff(data: Omit<Timeoff, 'id'>): Promise<Timeoff> 
{
    const token = getToken();
    const response = await fetch(`${API_URL}/timeoffs`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json" // Capitalized for standards
        },  
        body: JSON.stringify(data) // Passed the data object here
    });

    if (!response.ok) {
        // Try parsing the server error message if available, else fallback
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to create shift");
    }

    return response.json();
}
export async function updateTimeoff(id: number, data: Partial<Timeoff>): Promise<Timeoff> {
    const token = getToken();
    console.log(data);
    const response = await fetch(`${API_URL}/timeoffs/${id}`, {
        method: "PATCH", 
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to update shift");
    }

    return response.json();
}
export async function deleteTimeoff(ids: number[]): Promise<void> {
    const token = getToken();
    const response = await fetch(`${API_URL}/timeoffs`, {
        method: "DELETE",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ shift_ids: ids })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to remove shifts");
    }
}





export async function getShifts()
{
    const token = getToken();
    const response = await fetch(`${API_URL}/shifts`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
    });
    
    if (!response.ok) {
        throw new Error("Not authenticated");
    } 
    return response.json();
}
export async function createShift(data: Omit<Shift, 'id' | 'manager_id'>): Promise<Shift> 
{
    const token = getToken();
    const response = await fetch(`${API_URL}/shifts`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json" // Capitalized for standards
        },  
        body: JSON.stringify(data) // Passed the data object here
    });

    if (!response.ok) {
        // Try parsing the server error message if available, else fallback
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to create shift");
    }

    return response.json();
}
export async function updateShift(id: number, data: Partial<Shift>): Promise<Shift> {
    const token = getToken();
    console.log(data);
    const response = await fetch(`${API_URL}/shifts/${id}`, {
        method: "PUT", 
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to update shift");
    }

    return response.json();
}
export async function deleteShift(ids: number[]): Promise<void> {
    const token = getToken();
    const response = await fetch(`${API_URL}/shifts`, {
        method: "DELETE",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ shift_ids: ids })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to remove shifts");
    }
}



export async function getDepartments()
{
    const token = getToken();
    const response = await fetch(`${API_URL}/departments`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
    });
    
    if (!response.ok) {
        throw new Error("Not authenticated");
    }
    const test = response.clone()
    console.log(test.json());
    return response.json();
}
export async function createDepartment(data: Omit<Department, 'id' | 'manager_id'>): Promise<Department> 
{
    const token = getToken();
    const response = await fetch(`${API_URL}/departments`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json" // Capitalized for standards
        },  
        body: JSON.stringify(data) // Passed the data object here
    });

    if (!response.ok) {
        // Try parsing the server error message if available, else fallback
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to create department");
    }

    return response.json();
}
export async function updateDepartment(id: number, data: Partial<Department>): Promise<Department> {
    const token = getToken();
    console.log(data);
    const response = await fetch(`${API_URL}/departments/${id}`, {
        method: "PUT", 
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to update department");
    }

    return response.json();
}
export async function deleteDepartments(ids: number[]): Promise<void> {
    const token = getToken();
    const response = await fetch(`${API_URL}/departments`, {
        method: "DELETE",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ department_ids: ids })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to remove employees");
    }
}








export async function getMe(): Promise<Employee> {
    const token = getToken();
    const response = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    
    if (!response.ok) {
        throw new Error("Not authenticated");
    }
    
    return response.json();
}

export async function login(email: string, password: string): Promise<string> { 

    const response = await fetch(`${API_URL}/auth/login`, 
        { 
            method: "POST", 
            headers: 
                { 
                    "Content-Type": "application/json"
                }, 
            body: JSON.stringify({email:email, password:password}) 
        }
    );

    if(!response.ok)
    {
        throw new Error("Invalid credentials");
    }
 
    const data = await response.json();
    
    return data.access_token;
}

export async function getEmployees() : Promise<Employee[]> 
{
     
    const token = getToken();
    const response = await fetch(`${API_URL}/employees`, 
        {
            method: "GET",
            headers:
            {
                "Authorization" : `Bearer ${token}`,
                "content-type":"application/json"
            }
        });
    if(!response.ok)
    {
        throw new Error("Failed to fetch employees");
    }
    return response.json();
}
 export interface EmployeePublic {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    position: string | null;
}

// 2. Update the return type to match the new backend validation filtering layout
export async function getEmployeesPublic(): Promise<EmployeePublic[]> {
    const token = getToken();
    const response = await fetch(`${API_URL}/employees_public`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        }
    });

    if (!response.ok) {
        throw new Error("Failed to fetch employee list");
    }
    return response.json();
}

export async function createEmployee(data: Omit<Employee, 'id' | 'created_at' | 'is_active'> & { password: string }): Promise<Employee> {
    const token = getToken();
    const response = await fetch(`${API_URL}/employees`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json" // Capitalized for standards
        },  
        body: JSON.stringify(data) // Passed the data object here
    });

    if (!response.ok) {
        // Try parsing the server error message if available, else fallback
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to create employee");
    }

    return response.json();
}

export async function updateEmployee(id: number, data: Partial<Employee> & { password?: string }): Promise<Employee> {
    const token = getToken();
    const response = await fetch(`${API_URL}/employees/${id}`, {
        method: "PUT", 
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to update employee");
    }

    return response.json();
}
export async function deleteEmployeesAPI(ids: number[]): Promise<void> {
    const token = getToken();
    const response = await fetch(`${API_URL}/employees`, {
        method: "DELETE",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ employee_ids: ids })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to remove employees");
    }
}


export function setToken(token : string) : void
{
    localStorage.setItem('token',token);
}
export function getToken() : string | null
{
    return localStorage.getItem('token');
}
export function clearToken() : void
{
    localStorage.removeItem("token");
}
 