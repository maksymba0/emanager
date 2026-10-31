\# EManager — Employee \& Shift Management



A full-stack internal tool for managing employees, departments, shifts, and time-off requests. Built with role-based access control (employee / manager / admin).



\## Screenshots



Admin view:



Employee view:





\## Stack

\- \*\*Backend:\*\* FastAPI, SQLAlchemy, PostgreSQL, JWT

\- \*\*Frontend:\*\* React, TypeScript, Vite, Tailwind CSS

\- \*\*Infrastructure:\*\* Docker Compose



\## Features

\- JWT authentication with bcrypt password hashing

\- Role-based access control (RBAC)

\- CRUD for employees, departments, shifts, time-offs

\- Interactive dashboard with live stats

\- Filtering, bulk selection, and modals

\- log history



\## Running Locally

\### Backend

cd backend

docker compose up -d

pip install -r requirements.txt

uvicorn main:app --reload



\### Frontend

cd frontend

npm install

npm run dev



\## Architecture

(Request → FastAPI → SQLAlchemy → PostgreSQL)

(React SPA → FastAPI via JSON)



\## What I Learned

\- Separating API routes from CRUD logic

\- Stateless authentication with JWT

\- Protecting routes on both client and server

\- Handling foreign key constraints in delete operations

