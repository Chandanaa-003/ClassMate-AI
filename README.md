# ClassMate AI 🎓🤖

ClassMate AI is an intelligent, modern learning companion designed to assist students and educators with study material organization, automated summaries, quiz generation, and interactive learning assistance.

This repository contains the complete full-stack foundation and **Module 1: Authentication & Role-Based Access Control (RBAC)**.
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons, AuthContext state management.
- **Backend**: Python FastAPI, Pydantic v2, PyJWT, Bcrypt, Uvicorn.
- **Database**: SQLite with SQLAlchemy 2.0 ORM.
- **Security**: One-way bcrypt password hashing, signed JWT bearer authentication, role-based protection (Student & Lecturer).
- **Testing & Verification**: Automated health checks, SQLite connectivity checks, and pytest test suite.

---

## 🏗️ Architecture & Project Structure

```text
classmate_ai/
├── .gitignore                    # Git ignore configurations (Python, Node, SQLite, secrets)
├── README.md                     # Comprehensive project documentation
├── backend/                      # Python FastAPI application
│   ├── .env.example              # Environment variables template
│   ├── .env                      # Local development environment settings
│   ├── requirements.txt          # Python dependencies (FastAPI, PyJWT, Bcrypt, etc.)
│   ├── pytest.ini                # Pytest configuration
│   ├── app/                      # Application source code
│   │   ├── __init__.py
│   │   ├── main.py               # FastAPI entry point, CORS, and lifecycle
│   │   ├── core/
│   │   │   ├── __init__.py
│   │   │   ├── config.py         # Settings & environment validation (JWT secret, DB URL)
│   │   │   └── security.py       # Bcrypt hashing & PyJWT token creation/decoding
│   │   ├── db/
│   │   │   ├── __init__.py
│   │   │   ├── base.py           # SQLAlchemy declarative base
│   │   │   └── session.py        # SQLite engine, sessions & connectivity check
│   │   ├── models/               # SQLAlchemy ORM database models
│   │   │   ├── __init__.py
│   │   │   └── user.py           # User model with Student & Lecturer roles
│   │   ├── schemas/              # Pydantic data validation schemas
│   │   │   ├── __init__.py
│   │   │   ├── health.py         # Health check response schema
│   │   │   └── user.py           # UserCreate, UserLogin, UserResponse, Token schemas
│   │   └── api/                  # API routers and endpoints
│   │       ├── __init__.py
│   │       ├── deps.py           # JWT token validation & role-based dependencies
│   │       ├── router.py         # Main API router aggregator
│   │       └── routes/
│   │           ├── __init__.py
│   │           ├── auth.py       # Registration, login, profile, and role dashboards
│   │           └── health.py     # System & database health-check route
│   └── tests/                    # Backend unit & integration tests
│       ├── __init__.py
│       ├── test_auth.py          # Registration, login, JWT & RBAC tests
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
        │   ├── Login.tsx         # Attractive login form with client validation
        │   ├── Register.tsx      # Registration form with role picker (Student/Lecturer)
        │   ├── StudentDashboard.tsx # Student workspace & features
        │   ├── LecturerDashboard.tsx# Faculty portal & features
        │   └── HealthCheck.tsx   # Live API & SQLite status dashboard
        ├── services/             # Backend API communication clients
        │   ├── api.ts            # Health check & API fetchers
        │   └── auth.ts           # Authentication & dashboard API calls
        └── types/                # TypeScript interface definitions
            ├── auth.ts           # User, Role, AuthResponse, Payload types
            └── health.ts         # Health API response types
```

---

## 🔐 Module 1: Authentication & Role-Based Access Control

### Supported Roles
- **Student (`student`)**: Access study materials, AI lecture summaries, interactive tutor chats, and practice quizzes.
- **Lecturer (`lecturer`)**: Manage course syllabi, lecture slides, automated AI quiz generators, and cohort analytics.

### Authentication Endpoints

| Method | Endpoint | Description | Protected | Required Role |
| :--- | :--- | :--- | :---: | :---: |
| `POST` | `/api/v1/auth/register` | Register new user, hashes password, returns JWT | No | None |
| `POST` | `/api/v1/auth/login` | Authenticate credentials and return JWT | No | None |
| `GET` | `/api/v1/auth/me` | Retrieve profile of authenticated user | Yes | Any valid user |
| `GET` | `/api/v1/auth/student/dashboard` | Student dashboard data & permissions | Yes | `student` |
| `GET` | `/api/v1/auth/lecturer/dashboard` | Lecturer dashboard data & permissions | Yes | `lecturer` |
| `GET` | `/health` | System & SQLite database connectivity check | No | None |

---

## 📋 Prerequisites

- **Node.js**: `v18.0.0` or higher
- **Python**: `3.10` or higher
- **Git**

---

## 🚀 Quick Start Guide

### 1. Backend Setup (FastAPI & SQLite)

1. Open a terminal and navigate to the `backend` folder:
   ```bash
   cd backend
   ```

2. Activate Python virtual environment:
   ```powershell
   .\.venv\Scripts\Activate.ps1
   ```

3. Run the backend development server:
   ```bash
   python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```
   - API Root: [http://127.0.0.1:8000/](http://127.0.0.1:8000/)
   - Interactive Swagger API Docs: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
   - Health Check: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)

4. Run Backend Tests:
   ```bash
   # Run authentication & RBAC tests
   $env:PYTHONPATH="backend"; python backend/tests/test_auth.py

   # Run health check tests
   $env:PYTHONPATH="backend"; python backend/tests/test_health.py
   ```

---

### 2. Frontend Setup (React + Vite + Tailwind)

1. Navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```
   - Web App URL: [http://localhost:5173/](http://localhost:5173/)

3. Build for production:
   ```bash
   npm run build
   ```

---

## 🔒 Security Best Practices

- **Bcrypt Hashing**: Passwords are never stored in plain-text. They are hashed using `bcrypt` with automated salt generation.
- **Signed JWT Tokens**: Tokens are signed with `HS256` and verified on every protected route.
- **Role Enforcement**: Forbidden attempts (e.g., student trying to access `/lecturer/dashboard`) return HTTP 403 Forbidden.
- **Environment Secrets**: Sensitive keys are kept in `.env` and excluded via `.gitignore`.
