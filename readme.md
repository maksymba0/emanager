 
====================================================================
# EManager — Employee & Shift Management System

A full-stack internal tool for managing employees, departments, shifts, and time-off requests. Built with role-based access control for three user types: **employee**, **manager**, and **admin**.

## Screenshots

### Admin View

### Login page
<img width="1917" height="866" alt="Screenshot 2026-10-31 085144" src="https://github.com/user-attachments/assets/25610e1a-e7a3-46ff-b1f7-d96aba78626d" />
### Dashboard
<img width="1900" height="871" alt="Screenshot 2026-10-31 085153" src="https://github.com/user-attachments/assets/ac4d7e77-00a0-46bf-ab1c-4f3ad13360de" />

### Departments Employees Shifts Time-offs table
<img width="1901" height="867" alt="Screenshot 2026-10-31 085202" src="https://github.com/user-attachments/assets/466984f1-e3b7-4a9e-b0b5-2feec1627014" />
<img width="1915" height="862" alt="Screenshot 2026-10-31 085209" src="https://github.com/user-attachments/assets/9ef3471e-036d-4571-8789-1e464a80da22" />
<img width="1915" height="863" alt="Screenshot 2026-10-31 085214" src="https://github.com/user-attachments/assets/986bf4e6-4e1b-42b6-9123-150af34e9ae9" />
<img width="1917" height="866" alt="Screenshot 2026-10-31 085241" src="https://github.com/user-attachments/assets/dc8ea422-068f-4f08-bb61-5178da043f03" />
<img width="1912" height="865" alt="Screenshot 2026-10-31 085220" src="https://github.com/user-attachments/assets/d5a839f0-54af-4231-9702-3bebea12e6c3" />

### Employee View
<img width="1916" height="861" alt="Screenshot 2026-10-31 085751" src="https://github.com/user-attachments/assets/bdf0d248-d367-44c1-baf8-aa64ac719977" />
<img width="1917" height="862" alt="Screenshot 2026-10-31 085745" src="https://github.com/user-attachments/assets/456b01df-fe1c-48ca-a69d-0506f9c7db9d" />
<img width="1917" height="861" alt="Screenshot 2026-10-31 085739" src="https://github.com/user-attachments/assets/17e7dcb3-d261-48f6-bdbd-8f20b6792e7e" />
<img width="1917" height="866" alt="Screenshot 2026-10-31 085733" src="https://github.com/user-attachments/assets/30ec7fa1-9820-4035-a1a3-cf850a785595" />

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| Backend | FastAPI, SQLAlchemy, PostgreSQL, JWT |
| Frontend | React, TypeScript, Vite, Tailwind CSS |
| Infrastructure | Docker Compose |
| Auth | bcrypt password hashing, JWT tokens |

## Features

- **JWT authentication** — stateless login with bcrypt-hashed passwords
- **Role-based access control** — employees, managers, and admins see different UI and have different server-side permissions
- **Full CRUD** for employees, departments, shifts, and time-off requests
- **Cascade deletes** — deleting an employee nulls references (`reviewed_by`, `manager_id`) and removes owned records (`shifts`, `timeoffs`)
- **Interactive dashboard** — live stats (staff count, departments, shifts today, pending requests) and recent activity
- **Bulk operations** — select multiple rows, filter, batch delete
- **Protected routes** — client redirects unauthenticated users; server returns 403 on unauthorized requests

## Running Locally

### Prerequisites

- Python 3.11+
- Node.js 18+
- Docker

### Backend

**1. Start PostgreSQL**
cd backend
docker compose up -d

**2. Create and activate a virtual environment**
python -m venv .venv
..venv\Scripts\Activate.ps1


**3. Install dependencies**
pip install -r requirements.txt


**4. Seed the first admin account**
python seed.py

This creates `admin@test.com` / `admin`. Change the password after first login.

**5. Run the server**
python -m uvicorn main:app --reload


API: http://127.0.0.1:8000  
Swagger docs: http://127.0.0.1:8000/docs

### Frontend

**1. Install dependencies**
cd frontend
npm install

**2. Run the dev server**
npm run dev

App: http://localhost:5173

## Environment Variables

Rename `backend/.env.example` to `backend/.env` and fill in the values:
POSTGRES_USER=
POSTGRES_PASSWORD=
POSTGRES_DB=
SECRET_KEY=


`SECRET_KEY` signs JWT tokens. Generate a long random string (e.g. `openssl rand -hex 32`). Anyone who has this key can forge admin tokens, so keep it private!!!

## Architecture
React (localhost:5173)
│ HTTP + JWT in Authorization header
▼

FastAPI (localhost:8000)
│ SQLAlchemy ORM
▼

PostgreSQL (Docker, port 5432)

## What I Learned

- Separating route handlers from business logic with a CRUD layer
- Stateless authentication: signing and verifying JWT tokens
- Enforcing authorization server-side (`Depends(require_role(...))`) and hiding unauthorized UI client-side
- Handling foreign-key constraints on delete — deciding per-reference whether to cascade or null out
- Building a React SPA with TypeScript, React Router, and Tailwind
- Docker Compose for reproducible local environments

## License
MIT
