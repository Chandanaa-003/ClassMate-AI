# ClassMate AI 🎓🤖

ClassMate AI is an intelligent, modern learning companion designed to assist students and educators with study material organization, automated summaries, quiz generation, and interactive learning assistance.

This repository contains the complete full-stack foundation:
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons.
- **Backend**: Python FastAPI, Pydantic v2, Uvicorn.
- **Database**: SQLite with SQLAlchemy 2.0 ORM.
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
│   ├── requirements.txt          # Python dependencies
│   ├── pytest.ini                # Pytest configuration
│   ├── app/                      # Application source code
│   │   ├── __init__.py
│   │   ├── main.py               # FastAPI entry point, CORS, and lifecycle
│   │   ├── core/
│   │   │   ├── __init__.py
│   │   │   └── config.py         # Settings & environment validation
│   │   ├── db/
│   │   │   ├── __init__.py
│   │   │   ├── base.py           # SQLAlchemy declarative base
│   │   │   └── session.py        # SQLite engine, sessions & connectivity check
│   │   ├── models/               # SQLAlchemy ORM database models
│   │   │   └── __init__.py
│   │   ├── schemas/              # Pydantic data validation schemas
│   │   │   ├── __init__.py
│   │   │   └── health.py         # Health check response schema
│   │   └── api/                  # API routers and endpoints
│   │       ├── __init__.py
│   │       ├── router.py         # Main API router aggregator
│   │       └── routes/
│   │           ├── __init__.py
│   │           └── health.py     # System & database health-check route
│   └── tests/                    # Backend unit & integration tests
│       ├── __init__.py
│       └── test_health.py        # Health-check & endpoint verification tests
└── frontend/                     # React + Vite + Tailwind frontend
    ├── package.json              # NPM dependencies & scripts
    ├── index.html                # Single-page HTML shell
    ├── vite.config.ts            # Vite build configuration & API proxy
    ├── tsconfig.json             # TypeScript configuration
    ├── tsconfig.node.json        # TypeScript configuration for Vite
    ├── tailwind.config.js        # Tailwind CSS design system configuration
    ├── postcss.config.js         # PostCSS configuration
    └── src/                      # Frontend source code
        ├── main.tsx              # React DOM mounting
        ├── App.tsx               # Root component & layout
        ├── index.css             # Tailwind CSS imports & global styles
        ├── components/           # Reusable UI components
        │   ├── Header.tsx        # Top navigation & platform header
        │   └── HealthCheck.tsx   # Live API & SQLite status dashboard
        ├── services/             # Backend API communication clients
        │   └── api.ts            # Health check & API fetchers
        └── types/                # TypeScript interface definitions
            └── health.ts         # Health API response types
```

---

## 📋 Prerequisites

- **Node.js**: `v18.0.0` or higher (verified with `v26.13.0`)
- **npm**: `v9.0.0` or higher (verified with `v11.20.0`)
- **Python**: `3.10` or higher (verified with `Python 3.10.9`)
- **Git**

---

## 🚀 Quick Start Guide

### 1. Backend Setup (FastAPI & SQLite)

1. Open a terminal and navigate to the `backend` folder:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   - **Windows (PowerShell)**:
     ```powershell
     python -m venv .venv
     .\.venv\Scripts\Activate.ps1
     ```
   - **macOS / Linux**:
     ```bash
     python3 -m venv .venv
     source .venv/bin/activate
     ```

3. Install required dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure environment settings:
   Ensure `.env` exists (copied from `.env.example`):
   ```bash
   # Windows PowerShell
   Copy-Item .env.example .env
   ```

5. Run the backend development server:
   ```bash
   uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```
   - API Root: [http://127.0.0.1:8000/](http://127.0.0.1:8000/)
   - Health Check: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)
   - Interactive Swagger API Docs: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
   - ReDoc API Docs: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

---

### 2. Frontend Setup (React + Vite + Tailwind)

1. Open a new terminal and navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```

2. Install npm dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```
   - Web App URL: [http://localhost:5173/](http://localhost:5173/)

4. Build for production:
   ```bash
   npm run build
   ```

---

## 🩺 Health Check & Diagnostics

The backend includes a health-check API endpoint that verifies:
1. HTTP service availability.
2. SQLite database connectivity using an active SQL query (`SELECT 1`).
3. Application environment, version, and server timestamp.

### Endpoint: `GET /health` (or `GET /api/v1/health`)

#### Sample Response:
```json
{
  "status": "healthy",
  "project_name": "ClassMate AI",
  "environment": "development",
  "database": "connected",
  "version": "0.1.0",
  "timestamp": "2026-11-20T08:24:00.000000"
}
```

### Running Backend Tests
From the project root:
```bash
# Set PYTHONPATH and execute test runner
$env:PYTHONPATH="backend"; python backend/tests/test_health.py
```

---

## 🗄️ Database (SQLite) Configuration

The SQLite database is automatically initialized at startup using SQLAlchemy 2.0.
- **Default Database Location**: `backend/classmate.db`
- **Configurable Connection String**: Defined in `backend/.env` via `DATABASE_URL`:
  ```ini
  DATABASE_URL=sqlite:///./classmate.db
  ```
- **Thread Safety**: SQLite is configured with `check_same_thread=False` to safely handle asynchronous FastAPI workers.

---

## 🔒 Security Best Practices

- Secret files (`.env`, `.env.local`) and database binaries (`*.db`, `*.sqlite3`) are ignored in `.gitignore`.
- Never commit API keys or production secrets to source control.
- CORS origins are restricted to configured client hosts via `BACKEND_CORS_ORIGINS`.

---

## 📄 License
This project is licensed under the MIT License.

