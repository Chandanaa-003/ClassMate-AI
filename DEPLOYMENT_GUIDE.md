# 🚀 ClassMate AI – Production Deployment & Infrastructure Guide

This guide provides end-to-end instructions for deploying **ClassMate AI** to public production cloud environments.

---

## 🏛️ 1. Production Architecture

```
                  ┌────────────────────────────────────────┐
                  │          Vercel Global Edge            │
                  │       (React 18 + Vite Frontend)       │
                  │   - Automatic SPA routing (rewrites)   │
                  │   - Static asset CDN caching           │
                  │   - Base URL: VITE_API_BASE_URL        │
                  └───────────────────┬────────────────────┘
                                      │ HTTPS / WSS
                                      ▼
                  ┌────────────────────────────────────────┐
                  │       Render / Railway / Container     │
                  │          (FastAPI Backend)             │
                  │   - Lifespan startup/shutdown          │
                  │   - Uvicorn on dynamic $PORT           │
                  │   - Structured production logging      │
                  │   - Sanitized 500 error responses      │
                  │   - Probes: /health and /ready         │
                  └───────────┬────────────────┬───────────┘
                              │                │
            ┌─────────────────▼───┐        ┌───▼─────────────────┐
            │   Persistent Disk   │        │   Persistent Disk   │
            │   SQLite / Postgres │        │  Audio Lecture Dir  │
            │  (/data/db/*.db)    │        │   (/data/audio)     │
            └─────────────────────┘        └─────────────────────┘
```

---

## 🔑 2. Required Production Environment Variables

### Backend Configuration

| Variable | Required | Default / Example | Purpose & Notes |
|---|---|---|---|
| `ENVIRONMENT` | **Yes** | `production` | Enables production mode, disables debug logs, sanitizes error traces. |
| `DEBUG` | No | `False` | Forces debug mode off in production. |
| `PORT` | Auto | `8000` (injected by PaaS) | Listening port for Uvicorn (Render, Railway, Fly.io, Heroku inject this). |
| `DATABASE_URL` | **Yes** | `sqlite:////data/db/classmate.db` or `postgresql://...` | Database connection string. Automatically handles `sqlite:///` and `postgresql://`. |
| `SECRET_KEY` | **Yes** | `[random 64-char hex]` | Cryptographic key for signing JWT tokens. Must be >= 32 characters in production. |
| `JWT_SECRET_KEY` | Optional | Alias of `SECRET_KEY` | Alternative environment variable name for the JWT secret key. |
| `BACKEND_CORS_ORIGINS` | **Yes** | `["https://classmate.vercel.app"]` | Whitelisted frontend origins. Accepts JSON array or comma-separated string. |
| `CORS_ORIGINS` | Optional | `https://classmate.vercel.app` | Comma-separated alias for `BACKEND_CORS_ORIGINS`. |
| `AUDIO_STORAGE_PATH` | **Yes** | `/data/audio` | Absolute path to persistent volume where uploaded lecture recordings are stored. |
| `AI_PROVIDER` | No | `openai` | AI transcription and smart notes provider (`openai` or `mock`). |
| `OPENAI_API_KEY` | Optional | `sk-...` | OpenAI API key for Whisper and GPT-4o-mini. If omitted, built-in offline engine runs. |
| `WHISPER_MODEL` | No | `whisper-1` | OpenAI Whisper speech-to-text model. |
| `LLM_MODEL` | No | `gpt-4o-mini` | LLM model for grounded notes and chat assistance. |

### Frontend Configuration

| Variable | Required | Example | Purpose & Notes |
|---|---|---|---|
| `VITE_API_BASE_URL` | **Yes** | `https://classmate-api.onrender.com` | Public URL of the FastAPI backend. Must NOT have a trailing slash. |

---

## 💾 3. Database Persistence Strategy

### Option A: SQLite on Persistent Volume (Fastest, Cost-Effective)
- On platforms that support persistent disks (e.g. **Render Disks**, **Railway Volumes**, or **Docker Volumes**):
  - Mount a persistent disk to `/data`.
  - Set `DATABASE_URL=sqlite:////data/db/classmate.db`.
  - ClassMate AI automatically creates the parent directory `/data/db/` if it does not already exist.
  - The SQLite database survives container restarts, redeployments, and scaling.

### Option B: Managed PostgreSQL (Recommended for High Concurrency)
- When horizontal scaling (multiple backend instances) is required:
  1. Provision a managed PostgreSQL instance (e.g., Supabase, Neon, AWS RDS, Render Postgres).
  2. Set `DATABASE_URL=postgresql://user:password@hostname:5432/classmate_db`.
  3. `backend/app/db/session.py` automatically detects PostgreSQL, configures connection pool pre-ping (`pool_pre_ping=True`), and creates all tables on startup via `init_db()`.
  4. To migrate existing SQLite data to PostgreSQL, use standard migration utilities like `pgloader`:
     ```bash
     pgloader sqlite:///data/db/classmate.db postgresql://user:password@host/classmate_db
     ```

---

## 🎙️ 4. Audio Storage Persistence Strategy

- **Persistent Disk Storage:**
  - Uploaded lectures (`.mp3`, `.wav`, `.webm`, `.m4a`) are validated (MIME type check and max 50MB size).
  - Audio files are stored under `AUDIO_STORAGE_PATH` (e.g., `/data/audio`).
  - Storage paths are strictly private and never exposed to the public internet directly.
  - Audio is streamed securely through the authenticated endpoint `GET /api/v1/lectures/{id}/audio` with HTTP 206 Partial Content support for seeking.
- **Readiness Verification:**
  - The readiness probe (`GET /ready`) actively verifies that `AUDIO_STORAGE_PATH` is writable.

---

## 🌐 5. Frontend Deployment Instructions (Vercel)

### Deploying via Vercel Dashboard
1. Push your repository to **GitHub** / **GitLab**.
2. Sign in to [Vercel](https://vercel.com) and click **"Add New Project"**.
3. Select your repository.
4. In **Project Settings**:
   - **Root Directory:** Click Edit and select `frontend`.
   - **Framework Preset:** Vite (automatically detected).
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. In **Environment Variables**, add:
   - `VITE_API_BASE_URL`: `https://your-backend-service.onrender.com`
6. Click **Deploy**.
7. Verification:
   - Vercel automatically applies `frontend/vercel.json` rewrites, ensuring browser refreshes on routes like `/classroom/:id` or `/dashboard` work without 404 errors.

---

## 🖥️ 6. Backend Deployment Instructions (Render / Railway)

### Deploying to Render
1. Sign in to [Render](https://render.com) and click **New +** -> **Web Service**.
2. Connect your GitHub repository.
3. Configure settings:
   - **Name:** `classmate-ai-backend`
   - **Root Directory:** `backend`
   - **Environment:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Add a **Persistent Disk** (under Disks tab):
   - **Name:** `classmate-data`
   - **Mount Path:** `/data`
   - **Size:** 1 GB (or as needed)
5. Add **Environment Variables**:
   - `ENVIRONMENT`: `production`
   - `DEBUG`: `False`
   - `DATABASE_URL`: `sqlite:////data/db/classmate.db`
   - `AUDIO_STORAGE_PATH`: `/data/audio`
   - `SECRET_KEY`: `[generate using secrets.token_hex(32)]`
   - `BACKEND_CORS_ORIGINS`: `["https://your-frontend.vercel.app"]`
   - `AI_PROVIDER`: `openai`
   - `OPENAI_API_KEY`: `[your OpenAI API key]` (optional; fallback operates if omitted)
6. Click **Create Web Service**.

### Health Check Configuration on Render:
- **Health Check Path:** `/ready`

---

## 🐳 7. Self-Hosted VPS Deployment (Docker Compose)

For running on an Ubuntu / Debian VPS with Docker:

1. Clone repository to server:
   ```bash
   git clone https://github.com/your-username/classmate_ai.git
   cd classmate_ai
   ```
2. Copy environment templates:
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```
3. Edit `backend/.env` with your production `SECRET_KEY` and CORS domain:
   ```bash
   nano backend/.env
   ```
4. Start services in background:
   ```bash
   docker compose up -d --build
   ```
5. Check health:
   ```bash
   curl -f http://localhost:8000/ready
   ```

---

## 🛡️ 8. Production Security Verification

- [x] **JWT Secret Strength**: Validated in `backend/app/core/config.py` to warn/block default or weak keys in production.
- [x] **Password Hashing**: Uses `bcrypt` with salt rounds (plain-text passwords never stored).
- [x] **CORS Origin Whitelisting**: Strict `CORSMiddleware` restricted to specified production domains.
- [x] **Zero Stack Trace Exposure**: Production global exception handler sanitizes 500 errors and logs tracebacks privately server-side.
- [x] **Zero-Leak Anonymity**: Anonymous questions, answers, and student feedback have student IDs completely stripped from database queries and API responses.
- [x] **Path Traversal Defense**: File uploads sanitize filenames using UUIDs and validate MIME types against an audio whitelist.
- [x] **Non-Root Execution**: Docker container runs with defined permissions and isolated mounts.

---

## 🩺 9. Production Monitoring & Smoke Test Commands

After deployment, run these smoke tests against your live production endpoints:

```bash
# 1. Test Liveness Probe (Should return 200 OK with status="healthy")
curl -i https://your-backend-api.onrender.com/health

# 2. Test Readiness Probe (Should return 200 OK with status="ready")
curl -i https://your-backend-api.onrender.com/ready

# 3. Test API Root
curl -i https://your-backend-api.onrender.com/

# 4. Verify Frontend SPA loads
curl -i https://your-frontend.vercel.app/
```

