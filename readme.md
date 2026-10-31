====================================================================
# EManager — Employee & Shift Management System

A full-stack internal tool for managing employees, departments, shifts, and time-off requests. Built with role-based access control for three user types: **employee**, **manager**, and **admin**.

## Screenshots

### Admin View

![Login page](SCREENSHOT_URL_HERE)

![Dashboard](SCREENSHOT_URL_HERE)

![Employees table](SCREENSHOT_URL_HERE)

![Time-offs](SCREENSHOT_URL_HERE)

### Employee View

*(Screenshots coming soon)*

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