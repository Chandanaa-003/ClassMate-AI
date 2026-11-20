# ClassMate AI 🎓🤖

ClassMate AI is an intelligent, modern learning companion designed to assist students and educators with study material organization, automated summaries, quiz generation, and interactive learning assistance.

This repository contains the full-stack foundation, **Module 1: Authentication & RBAC**, and **Module 2: Classroom Management & Membership**.
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons, AuthContext state management.
- **Backend**: Python FastAPI, Pydantic v2, PyJWT, Bcrypt, Uvicorn.
- **Database**: SQLite with SQLAlchemy 2.0 ORM (`users`, `classrooms`, `classroom_memberships`).
- **Security**: One-way bcrypt password hashing, signed JWT bearer authentication, role-based protection (Student & Lecturer), classroom isolation.
- **Testing & Verification**: Comprehensive test suites for authentication, classroom lifecycles, and system health checks.

---

## 🏗️ Architecture & Project Structure

```text
classmate_ai/
├── .gitignore                    # Git ignore configurations (Python, Node, SQLite, secrets)
├── README.md                     # Comprehensive project documentation
├── backend/                      # Python FastAPI application
│   ├── .env.example              # Environment variables template
│   ├── .env                      # Local development environment settings
│   ├── requirements.txt          # Python dependencies
│   ├── pytest.ini                # Pytest configuration
│   ├── app/                      # Application source code
│   │   ├── __init__.py
│   │   ├── main.py               # FastAPI entry point, CORS, and lifecycle
│   │   ├── core/
│   │   │   ├── __init__.py
│   │   │   ├── config.py         # Settings & environment validation
│   │   │   ├── codes.py          # Unique join code generator (CM-XXXX)
│   │   │   └── security.py       # Bcrypt hashing & PyJWT token utilities
│   │   ├── db/
│   │   │   ├── __init__.py
│   │   │   ├── base.py           # SQLAlchemy declarative base
│   │   │   └── session.py        # SQLite engine, sessions & connectivity check
│   │   ├── models/               # SQLAlchemy ORM database models
│   │   │   ├── __init__.py
│   │   │   ├── user.py           # User model with Student & Lecturer roles
│   │   │   └── classroom.py      # Classroom & ClassroomMembership models
│   │   ├── schemas/              # Pydantic data validation schemas
│   │   │   ├── __init__.py
│   │   │   ├── health.py         # Health check response schema
│   │   │   ├── user.py           # User authentication schemas
│   │   │   └── classroom.py      # Classroom request/response schemas
│   │   └── api/                  # API routers and endpoints
│   │       ├── __init__.py
│   │       ├── deps.py           # JWT token validation & role-based dependencies
│   │       ├── router.py         # Main API router aggregator
│   │       └── routes/
│   │           ├── __init__.py
│   │           ├── auth.py       # Registration, login, profile, and role dashboards
│   │           ├── classroom.py  # Classroom creation, joining, roster, and leaving
│   │           └── health.py     # System & database health-check route
│   └── tests/                    # Backend unit & integration tests
│       ├── __init__.py
│       ├── test_auth.py          # Registration, login, JWT & RBAC tests
│       ├── test_classroom.py     # Classroom lifecycle, joining, isolation, leave tests
│       └── test_health.py        # Health-check & endpoint verification tests
└── frontend/                     # React + Vite + Tailwind frontend
    ├── package.json              # NPM dependencies & scripts
    ├── index.html                # Single-page HTML shell
    ├── vite.config.ts            # Vite build configuration & API proxy
    ├── tsconfig.json             # TypeScript configuration
    ├── tailwind.config.js        # Tailwind CSS design system configuration
    ├── postcss.config.js         # PostCSS configuration
    └── src/                      # Frontend source code
        ├── main.tsx              # React DOM mounting
        ├── App.tsx               # Root component & role-based view routing
        ├── index.css             # Tailwind CSS imports & global styles
        ├── context/
        │   └── AuthContext.tsx   # Global authentication state & session persistence
        ├── components/           # Reusable UI components
        │   ├── Header.tsx        # Top navigation, role badges & logout
        │   ├── Login.tsx         # Login form with validation & demo credentials
        │   ├── Register.tsx      # Registration form with role picker
        │   ├── StudentDashboard.tsx # Student workspace & enrolled classrooms
        │   ├── LecturerDashboard.tsx# Lecturer faculty portal & teaching classrooms
        │   ├── ClassroomCard.tsx # Reusable classroom card with copy code trigger
        │   ├── ClassroomDetail.tsx # Full classroom workspace & member roster
        │   ├── CreateClassroomModal.tsx # Lecturer classroom creation dialog
        │   ├── JoinClassroomModal.tsx   # Student join classroom dialog
        │   └── HealthCheck.tsx   # Live API & SQLite status dashboard
        ├── services/             # Backend API communication clients
        │   ├── api.ts            # Health check fetcher
        │   ├── auth.ts           # Authentication API client
        │   └── classroom.ts      # Classroom management API client
        └── types/                # TypeScript interface definitions
            ├── auth.ts           # User, Role, AuthResponse types
            ├── classroom.ts      # Classroom, Member, Payload types
            └── health.ts         # Health API response types
```

---

## 🏫 Module 2: Classroom Management & Membership

### Classroom Endpoints

| Method | Endpoint | Description | Protected | Allowed Role |
| :--- | :--- | :--- | :---: | :---: |
| `POST` | `/api/v1/classrooms` | Create classroom with auto-generated join code | Yes | `lecturer` |
| `POST` | `/api/v1/classrooms/join` | Join classroom using code | Yes | `student` / authenticated |
| `GET` | `/api/v1/classrooms` | List classrooms (created for lecturers, joined for students) | Yes | Authenticated |
| `GET` | `/api/v1/classrooms/{id}` | Classroom details, stats & member roster | Yes | Enrolled Member / Owner |
| `GET` | `/api/v1/classrooms/{id}/members` | Member roster of students | Yes | Enrolled Member / Owner |
| `DELETE` | `/api/v1/classrooms/{id}/leave` | Leave a classroom | Yes | `student` member |

### Security & Data Isolation
- **Role Validation**: Only lecturers can create classrooms (`POST /api/v1/classrooms` returns `403 Forbidden` if invoked by a student).
- **Membership Isolation**: Accessing `/classrooms/{id}` or `/classrooms/{id}/members` validates that the user is either the classroom owner or an enrolled member. Non-members receive `403 Forbidden`.
- **Duplicate Prevention**: Database unique constraint `(classroom_id, user_id)` and endpoint checks prevent a student from joining the same classroom twice (`400 Bad Request`).
- **Owner Protection**: Lecturers cannot leave their own classrooms (`400 Bad Request`).
- **Identity Integrity**: User IDs are always derived from the authenticated JWT token, never trusted from frontend request bodies.

---

## 🚀 Quick Start Guide

### 1. Backend Setup & Run

```powershell
cd backend
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
- API Docs: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- Health Check: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)

### 2. Run Backend Tests

```powershell
# Run all test suites
$env:PYTHONPATH="backend"; python backend/tests/test_auth.py; python backend/tests/test_classroom.py; python backend/tests/test_health.py
```

### 3. Frontend Setup & Run

```powershell
cd frontend
npm run dev
```
- Web Application: [http://localhost:5173](http://localhost:5173)

---

## 📄 License
MIT License
