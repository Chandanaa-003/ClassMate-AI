# ClassMate AI 🎓🤖

ClassMate AI is an intelligent, modern learning companion designed to assist students and educators with study material organization, automated summaries, quiz generation, and interactive learning assistance.

This repository contains the full-stack foundation, **Module 1: Authentication & RBAC**, **Module 2: Classroom Management & Membership**, and **Module 3: Subject Management & Syllabi Organization**.
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons, AuthContext state management.
- **Backend**: Python FastAPI, Pydantic v2, PyJWT, Bcrypt, Uvicorn.
- **Database**: SQLite with SQLAlchemy 2.0 ORM (`users`, `classrooms`, `classroom_memberships`, `subjects`).
- **Security**: One-way bcrypt password hashing, signed JWT bearer authentication, role-based protection (Student & Lecturer), classroom & subject membership isolation.
- **Testing & Verification**: Comprehensive unit and integration test suites with 100% pass rates.

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
│   │   │   ├── classroom.py      # Classroom & ClassroomMembership models
│   │   │   └── subject.py        # Subject model with classroom & creator relations
│   │   ├── schemas/              # Pydantic data validation schemas
│   │   │   ├── __init__.py
│   │   │   ├── health.py         # Health check response schema
│   │   │   ├── user.py           # User authentication schemas
│   │   │   ├── classroom.py      # Classroom request/response schemas
│   │   │   └── subject.py        # Subject create, update, response schemas
│   │   └── api/                  # API routers and endpoints
│   │       ├── __init__.py
│   │       ├── deps.py           # JWT token validation & role-based dependencies
│   │       ├── router.py         # Main API router aggregator
│   │       └── routes/
│   │           ├── __init__.py
│   │           ├── auth.py       # Registration, login, profile, and role dashboards
│   │           ├── classroom.py  # Classroom creation, joining, roster, and leaving
│   │           ├── subject.py    # Subject CRUD, duplicate checks, member access
│   │           └── health.py     # System & database health-check route
│   └── tests/                    # Backend unit & integration tests
│       ├── __init__.py
│       ├── test_auth.py          # Registration, login, JWT & RBAC tests
│       ├── test_classroom.py     # Classroom lifecycle, joining, isolation, leave tests
│       ├── test_subject.py       # Subject CRUD, permissions, duplicates, access tests
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
        ├── App.tsx               # Root component & multi-level view routing
        ├── index.css             # Tailwind CSS imports & global styles
        ├── context/
        │   └── AuthContext.tsx   # Global authentication state & session persistence
        ├── components/           # Reusable UI components
        │   ├── Header.tsx        # Top navigation, role badges & logout
        │   ├── Breadcrumbs.tsx   # Breadcrumb navigation trails
        │   ├── Login.tsx         # Login form with validation & demo credentials
        │   ├── Register.tsx      # Registration form with role picker
        │   ├── StudentDashboard.tsx # Student workspace & enrolled classrooms
        │   ├── LecturerDashboard.tsx# Lecturer faculty portal & teaching classrooms
        │   ├── ClassroomCard.tsx # Reusable classroom card with copy code trigger
        │   ├── ClassroomDetail.tsx # Classroom workspace, subjects & member roster
        │   ├── SubjectCard.tsx   # Responsive subject card with edit/delete actions
        │   ├── SubjectModal.tsx  # Create/edit subject dialog
        │   ├── SubjectDetail.tsx # Subject workspace & study materials space
        │   ├── CreateClassroomModal.tsx # Lecturer classroom creation dialog
        │   ├── JoinClassroomModal.tsx   # Student join classroom dialog
        │   └── HealthCheck.tsx   # Live API & SQLite status dashboard
        ├── services/             # Backend API communication clients
        │   ├── api.ts            # Health check fetcher
        │   ├── auth.ts           # Authentication API client
        │   ├── classroom.ts      # Classroom management API client
        │   └── subject.ts        # Subject management API client
        └── types/                # TypeScript interface definitions
            ├── auth.ts           # User, Role, AuthResponse types
            ├── classroom.ts      # Classroom, Member, Payload types
            ├── subject.ts        # Subject, Create/Update Payload types
            └── health.ts         # Health API response types
```

---

## 📚 Module 3: Subject Management & Syllabi Organization

### Subject Endpoints

| Method | Endpoint | Description | Protected | Allowed Role |
| :--- | :--- | :--- | :---: | :---: |
| `POST` | `/api/v1/classrooms/{classroom_id}/subjects` | Create a subject in a classroom | Yes | Classroom Lecturer Owner |
| `GET` | `/api/v1/classrooms/{classroom_id}/subjects` | List subjects in a classroom | Yes | Enrolled Member / Owner |
| `GET` | `/api/v1/subjects/{subject_id}` | Retrieve specific subject details | Yes | Enrolled Member / Owner |
| `PUT` | `/api/v1/subjects/{subject_id}` | Update subject metadata | Yes | Classroom Lecturer Owner |
| `DELETE` | `/api/v1/subjects/{subject_id}` | Delete subject | Yes | Classroom Lecturer Owner |

### Features & Security Enforcements
- **Ownership Enforcement**: Only the lecturer who created the classroom can add, edit, or delete its subjects (**403 Forbidden** for students or other lecturers).
- **Duplicate Prevention**: Case-insensitive duplicate checks prevent subjects with the same name from coexisting in the same classroom (**400 Bad Request**).
- **Membership Isolation**: Only students enrolled in the classroom or the owning lecturer can view the subjects or subject details (**403 Forbidden** for non-members).
- **Cascade Deletion**: When a classroom is removed, all associated subjects and memberships are automatically cleaned up via SQLAlchemy `cascade="all, delete-orphan"`.
- **Real-Time Search & Filtering**: Client-side instant filtering across subject names, subject codes (e.g. `CS101`), and descriptions.
- **Breadcrumbs Navigation**: Full clickable breadcrumb trails (`Classrooms / [Classroom Name] / [Subject Name]`) for effortless navigation.

---

## 🚀 Quick Start Guide

### 1. Run the Backend Server

```powershell
cd backend
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
- API Documentation (Swagger): [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- Health Check: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)

### 2. Run Backend Tests

```powershell
# Run all test suites
$env:PYTHONPATH="backend"; python backend/tests/test_auth.py; python backend/tests/test_classroom.py; python backend/tests/test_subject.py; python backend/tests/test_health.py
```

### 3. Run the Frontend Development Server

```powershell
cd frontend
npm run dev
```
- Frontend Application: [http://localhost:5173](http://localhost:5173)

---

## 📄 License
MIT License
