# ClassMate AI 🎓🤖

ClassMate AI is an intelligent, modern learning companion designed to assist students and educators with study material organization, automated summaries, quiz generation, and interactive learning assistance.

This repository contains the full-stack foundation, **Module 1: Authentication & RBAC**, **Module 2: Classroom Management & Membership**, **Module 3: Subject Management & Syllabi Organization**, **Module 4: Anonymous Doubt Discussion**, **Module 5: Lecture Recording and Upload System**, **Module 6: AI Audio Transcription and Smart Notes**, and **Module 8: Anonymous Feedback and Lecturer Analytics**.
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons, MediaRecorder browser audio capture, AuthContext state management.
- **Backend**: Python FastAPI, Pydantic v2, PyJWT, Bcrypt, Python-Multipart, Aiofiles, OpenAI Whisper / GPT-4o-mini SDK, Uvicorn.
- **Database**: SQLite with SQLAlchemy 2.0 ORM (`users`, `classrooms`, `classroom_memberships`, `subjects`, `doubts`, `answers`, `votes`, `lectures`, `transcripts`, `smart_notes`, `feedbacks`).
- **Security**: One-way bcrypt password hashing, signed JWT bearer authentication, role-based protection (Student & Lecturer), classroom & subject membership isolation, zero-leak anonymous author masking, strict student identity isolation in feedback, path traversal defense, file type/size validation, and background AI job isolation.
- **Testing & Verification**: Comprehensive unit and integration test suites with 100% pass rates across all modules.

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
│   │   │   ├── security.py       # Bcrypt hashing & PyJWT token utilities
│   │   │   └── storage.py        # Modular audio file storage & validation
│   │   ├── db/
│   │   │   ├── __init__.py
│   │   │   ├── base.py           # SQLAlchemy declarative base
│   │   │   └── session.py        # SQLite engine, sessions & connectivity check
│   │   ├── models/               # SQLAlchemy ORM database models
│   │   │   ├── __init__.py
│   │   │   ├── user.py           # User model with Student & Lecturer roles
│   │   │   ├── classroom.py      # Classroom & ClassroomMembership models
│   │   │   ├── subject.py        # Subject model with classroom & creator relations
│   │   │   ├── doubt.py          # Doubt, Answer, and Vote models
│   │   │   ├── lecture.py        # Lecture recording model with approval statuses
│   │   │   ├── transcript.py     # AI transcript model with timestamps & language
│   │   │   ├── smart_note.py     # 9-section structured smart notes model
│   │   │   └── feedback.py       # Anonymous feedback model & unique constraints
│   │   ├── services/             # Core business & AI service layer
│   │   │   ├── analytics.py      # Feedback metrics & theme extraction service
│   │   │   └── ai/
│   │   │       ├── __init__.py
│   │   │       ├── provider.py   # AI provider configuration & client factory
│   │   │       ├── transcription.py # Whisper & Kannada/mixed transcription
│   │   │       └── notes_generator.py # Grounded 9-section smart notes generator
│   │   ├── schemas/              # Pydantic data validation schemas
│   │   │   ├── __init__.py
│   │   │   ├── health.py         # Health check response schema
│   │   │   ├── user.py           # User authentication schemas
│   │   │   ├── classroom.py      # Classroom request/response schemas
│   │   │   ├── subject.py        # Subject create, update, response schemas
│   │   │   ├── doubt.py          # Doubt, Answer, Vote create & response schemas
│   │   │   ├── lecture.py        # Lecture upload, review, and response schemas
│   │   │   ├── ai.py             # Transcript, segment & smart note schemas
│   │   │   └── feedback.py       # Anonymous feedback & analytics schemas
│   │   └── api/                  # API routers and endpoints
│   │       ├── __init__.py
│   │       ├── deps.py           # JWT token validation & role-based dependencies
│   │       ├── router.py         # Main API router aggregator
│   │       └── routes/
│   │           ├── __init__.py
│   │           ├── auth.py       # Registration, login, profile, and role dashboards
│   │           ├── classroom.py  # Classroom creation, joining, roster, and leaving
│   │           ├── subject.py    # Subject CRUD, duplicate checks, member access
│   │           ├── doubt.py      # Anonymous doubts, answers, voting & acceptance
│   │           ├── lecture.py    # Audio upload, streaming, review & deletion
│   │           ├── ai.py         # Async transcription & smart notes endpoints
│   │           ├── feedback.py   # Anonymous student feedback & analytics endpoints
│   │           └── health.py     # System & database health-check route
│   └── tests/                    # Backend unit & integration tests
│       ├── __init__.py
│       ├── test_auth.py          # Registration, login, JWT & RBAC tests
│       ├── test_classroom.py     # Classroom lifecycle, joining, isolation, leave tests
│       ├── test_subject.py       # Subject CRUD, permissions, duplicates, access tests
│       ├── test_doubt.py         # Anonymity masking, single vote, answers, acceptance
│       ├── test_lecture.py       # Audio uploads, review workflow, privacy, streaming
│       ├── test_ai.py            # AI transcription, Kannada/mixed, notes, edit, retry
│       ├── test_feedback.py      # Anonymous feedback, single-submission, isolation & analytics
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
        │   ├── ClassroomDetail.tsx # Classroom workspace, subjects, roster & analytics tab
        │   ├── SubjectCard.tsx   # Responsive subject card with edit/delete actions
        │   ├── SubjectModal.tsx  # Create/edit subject dialog
        │   ├── SubjectDetail.tsx # Subject workspace, tabs, doubts, lectures & feedback
        │   ├── StudentFeedbackForm.tsx # 1-5 star ratings, period picker, anonymous submit/edit
        │   ├── LecturerFeedbackAnalytics.tsx # KPI summary cards, rating bars, themes & comments
        │   ├── AudioPlayer.tsx   # Interactive audio player with scrubber & speed controls
        │   ├── RecordLectureModal.tsx # MediaRecorder audio recording with consent check
        │   ├── UploadLectureModal.tsx # Drag & drop audio uploader with validation
        │   ├── ReviewLectureModal.tsx # Lecturer audio review, approval & rejection modal
        │   ├── LectureLibrary.tsx # Lecture library, study workspace & audio streaming
        │   ├── TranscriptSection.tsx # Timestamped transcript, seek buttons & inline editor
        │   ├── SmartNotesSection.tsx # 9-section structured notes & clipboard copier
        │   ├── DoubtCard.tsx     # Discussion question card with badges & counts
        │   ├── DoubtThread.tsx   # Complete discussion thread, replies & upvoting
        │   ├── AskDoubtModal.tsx # Anonymous/identified doubt question composer
        │   ├── CreateClassroomModal.tsx # Lecturer classroom creation dialog
        │   ├── JoinClassroomModal.tsx   # Student join classroom dialog
        │   └── HealthCheck.tsx   # Live API & SQLite status dashboard
        ├── services/             # Backend API communication clients
        │   ├── api.ts            # Health check fetcher
        │   ├── auth.ts           # Authentication API client
        │   ├── classroom.ts      # Classroom management API client
        │   ├── subject.ts        # Subject management API client
        │   ├── doubt.ts          # Doubts, answers, voting & acceptance client
        │   ├── lecture.ts        # Audio upload, review & streaming client
        │   ├── ai.ts             # AI transcription & smart notes client
        │   └── feedback.ts       # Feedback submission & analytics client
        └── types/                # TypeScript interface definitions
            ├── auth.ts           # User, Role, AuthResponse types
            ├── classroom.ts      # Classroom, Member, Payload types
            ├── subject.ts        # Subject, Create/Update Payload types
            ├── doubt.ts          # Doubt, Answer, Vote, Filter types
            ├── lecture.ts        # Lecture, Review, Status types
            ├── ai.ts             # Transcript, Segment, SmartNote types
            ├── feedback.ts       # Feedback, Analytics, Distribution types
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

## 💬 Module 4: Anonymous Doubt Discussion

### Doubt & Answer Endpoints

| Method | Endpoint | Description | Protected | Allowed Role |
| :--- | :--- | :--- | :---: | :---: |
| `POST` | `/api/v1/subjects/{subject_id}/doubts` | Post a doubt (anonymous or identified) | Yes | Classroom Member or Lecturer |
| `GET` | `/api/v1/subjects/{subject_id}/doubts` | List doubts with search & filter | Yes | Classroom Member or Lecturer |
| `GET` | `/api/v1/doubts/{doubt_id}` | Retrieve doubt thread & all answers | Yes | Classroom Member or Lecturer |
| `POST` | `/api/v1/doubts/{doubt_id}/answers` | Post an answer to a doubt | Yes | Classroom Member or Lecturer |
| `POST` | `/api/v1/answers/{answer_id}/vote` | Upvote an answer (once per user) | Yes | Classroom Member or Lecturer |
| `POST` | `/api/v1/answers/{answer_id}/accept` | Accept an answer as verified solution | Yes | Question Author Only |
| `DELETE` | `/api/v1/doubts/{doubt_id}` | Moderate or delete a doubt | Yes | Author or Classroom Lecturer |

### Security & Privacy Protections
- **Zero-Leak Anonymity**: When `is_anonymous=true`, the author's identity is masked as `"Anonymous Student"` or `"Anonymous Lecturer"`. The database stores the real `author_id` privately for permissions, but it is strictly omitted from public API serialization.
- **Dynamic Author Capability**: The API dynamically outputs `is_author: bool` based on the caller's JWT token, so authors can manage their questions or accept answers without revealing their identity to peers.
- **Vote Integrity**: Answers feature single-vote upvoting backed by a unique database constraint (`user_id`, `answer_id`). Repeat attempts return **400 Bad Request**.
- **Accepted Answer Exclusivity**: Only the question author can accept an answer (**403 Forbidden** for anyone else). Marking an answer as accepted immediately marks the doubt as `RESOLVED`.
- **Discussion Moderation**: Lecturers who own the classroom can delete questions for moderation; authors can also delete their own doubts (**403 Forbidden** for other members).
- **Membership Boundary**: Only students and lecturers with active membership in the parent classroom can view or participate in doubts (**403 Forbidden** for outsiders).

### Frontend User Interface
- **Anonymous Posting by Default**: "Ask Anonymously" toggle is checked by default in the Ask Doubt modal to encourage participation without hesitation.
- **Rich Discussion Board**: Features filter tabs (**Latest**, **Unanswered**, **Most Popular**, **Resolved**) and keyword search across question titles and descriptions.
- **Full Thread View**: Displays answer rosters with accepted solution banners, upvote counts, interactive upvote buttons, and answer composer with optional anonymity.

---

## 🎙️ Module 5: Lecture Recording & Upload System

### Lecture Endpoints

| Method | Endpoint | Description | Protected | Allowed Role |
| :--- | :--- | :--- | :---: | :---: |
| `POST` | `/api/v1/subjects/{subject_id}/lectures/upload` | Upload lecture audio (MP3, WAV, WebM) | Yes | Classroom Member or Lecturer |
| `GET` | `/api/v1/subjects/{subject_id}/lectures` | List lectures with approval visibility filter | Yes | Classroom Member or Lecturer |
| `GET` | `/api/v1/lectures/{lecture_id}` | Retrieve lecture metadata & details | Yes | Member (Approved) / Uploader / Lecturer |
| `GET` | `/api/v1/lectures/{lecture_id}/audio` | Stream lecture audio with partial ranges | Yes | Member (Approved) / Uploader / Lecturer |
| `PATCH` | `/api/v1/lectures/{lecture_id}/review` | Approve or reject a lecture recording | Yes | Classroom Lecturer Owner |
| `DELETE` | `/api/v1/lectures/{lecture_id}` | Delete lecture recording and audio file | Yes | Uploader or Classroom Lecturer |

### Modular Audio Storage & Defense-in-Depth
- **Modular Storage Architecture (`app/core/storage.py`)**: Audio files are stored under `backend/uploads/lectures/` with cryptographically random UUID filenames (`{uuid4}.{ext}`). Internal filesystem paths are never leaked in client responses; instead, clients receive secure streaming endpoints (`/api/v1/lectures/{id}/audio`).
- **Path Traversal Defense**: Strict resolution checks (`resolved_path.startswith(BASE_UPLOAD_DIR)`) ensure malicious paths (e.g. `../../etc/passwd`) are immediately rejected with **400 Bad Request**.
- **Format & Size Validation**: Enforces whitelist of safe audio extensions (`.mp3`, `.wav`, `.webm`, `.ogg`, `.m4a`, `.aac`) and audio MIME types, along with a strict **50 MB file size limit**.
- **Browser Audio Recording (`MediaRecorder` API)**:
  - Users can record live classroom audio directly from the browser.
  - Required consent check ensures recordings are conducted with lecturer authorization.
  - Gracefully handles microphone permission denials (`NotAllowedError`), missing devices (`NotFoundError`), and unsupported browsers.
  - Live timer, visual recording pulse, pause/resume, stop, and local audio preview before submission.
- **Lecturer Review & Approval Pipeline**:
  - Student recordings default to `PENDING` status.
  - **Zero Leakage**: Pending and rejected recordings are strictly hidden from general classroom members.
  - Lecturers access a dedicated **Review Queue** with audio player preview, one-click **Approve**, or **Reject** with structured feedback.
  - Students can track their submission status (`Pending`, `Approved`, `Rejected`) under their **My Uploads** tab.
- **Dual Stream Authentication**: Supports both standard Bearer headers and query parameters (`?token=...`) allowing HTML5 `<audio>` tags to stream, seek, and scrub with full HTTP range request support.

---

## 🤖 Module 6: AI Audio Transcription & Smart Notes

### AI Endpoints

| Method | Endpoint | Description | Protected | Allowed Role |
| :--- | :--- | :--- | :---: | :---: |
| `POST` | `/api/v1/lectures/{lecture_id}/transcribe` | Trigger asynchronous audio transcription (Whisper) | Yes | Classroom Member or Lecturer |
| `GET` | `/api/v1/lectures/{lecture_id}/transcript` | Get transcript status, full text & timestamped segments | Yes | Classroom Member or Lecturer |
| `PUT` | `/api/v1/lectures/{lecture_id}/transcript` | Edit and correct transcript text | Yes | Uploader or Classroom Lecturer |
| `POST` | `/api/v1/lectures/{lecture_id}/generate-notes` | Generate grounded 9-section Smart Notes | Yes | Classroom Member or Lecturer |
| `GET` | `/api/v1/lectures/{lecture_id}/notes` | Get structured study notes, markdown & sections | Yes | Classroom Member or Lecturer |

### AI Service Architecture & Anti-Hallucination Features
- **Configurable Provider (`backend/app/services/ai/`)**: Supports `OpenAI Whisper` (`whisper-1`) and `OpenAI GPT-4o-mini` with graceful fallback to offline grounded generation when API keys are not provided.
- **Multilingual & Mixed-Speech Support**: Transcribes English, pure Kannada (`kn`), and Kannada-English mixed speech (`Namaskara students...`).
- **Clickable Timestamp Seeking**: Transcripts provide structured segments (`start`, `end`, `text`). Clicking any timestamp (`[01:23]`) in the UI immediately seeks the audio player to that exact moment.
- **Strict Grounding Guarantee**: Study notes are strictly grounded in the verified transcript. If the transcript is too short or lacks substantive material, the AI explicitly reports insufficient content instead of inventing topics.
- **9-Section Structured Notes**:
  1. Lecture Overview
  2. Important Concepts
  3. Topic-wise Explanations
  4. Key Definitions
  5. Important Points
  6. Examples Mentioned in Lecture
  7. Important Keywords
  8. Quick Revision Summary
  9. Possible Exam Questions
- **One-Click Copy**: Students can copy the entire formatted markdown notes directly to their clipboard with instant feedback.
- **Background Task Processing**: Non-blocking async workers (`BackgroundTasks`) manage long-running transcription and summarization jobs while clients poll status.

---

## 📊 Module 8: Anonymous Feedback and Lecturer Analytics

### Feedback & Analytics Endpoints

| Method | Endpoint | Description | Protected | Allowed Role |
| :--- | :--- | :--- | :---: | :---: |
| `POST` | `/api/v1/subjects/{subject_id}/feedback` | Submit anonymous student feedback for a subject & period | Yes | Classroom Student Member |
| `PUT` | `/api/v1/feedback/{feedback_id}` | Edit & update student's own previously submitted feedback | Yes | Feedback Author (Student) |
| `GET` | `/api/v1/subjects/{subject_id}/feedback/me` | Fetch student's own feedback for a specific period | Yes | Feedback Author (Student) |
| `GET` | `/api/v1/subjects/{subject_id}/feedback/analytics` | Fetch aggregated subject analytics, distribution & themes | Yes | Classroom Lecturer Owner |
| `GET` | `/api/v1/classrooms/{classroom_id}/feedback/analytics` | Fetch classroom-wide analytics & subject comparisons | Yes | Classroom Lecturer Owner |

### Strict Privacy & Anonymity Architecture
- **Zero Identity Exposure**: In all lecturer and public feedback endpoints, `student_id`, student names, and emails are strictly withheld. The `FeedbackResponse` and `AnonymizedFeedbackItem` Pydantic schemas omit user identifiers entirely.
- **Single Submission Guarantee**: A composite unique constraint in SQLAlchemy/SQLite (`UniqueConstraint("subject_id", "student_id", "feedback_period")`) enforces exactly one submission per student per subject per period (`general`, `midterm`, `end-term`).
- **Student Edit Rights**: Students can safely revisit and update their submitted feedback (`PUT /api/v1/feedback/{feedback_id}`) without leaking identity to lecturers.
- **Low Sample Size Warning**: If fewer than 3 students have submitted feedback (`has_sufficient_data: False`), the system issues an explicit preliminary sample size notice on the dashboard to prevent unwarranted statistical conclusions.
- **Grounded Analytics & Theme Extraction**:
  - Calculates true arithmetic means for Overall Satisfaction, Teaching Clarity, Lecture Pace, and Concept Understanding.
  - Generates full 1-to-5 star frequency distributions and percentages.
  - Extracts key positive strengths and actionable improvement themes directly from student remarks.
  - Classroom-level analytics offers a side-by-side comparison table of all subjects in the course space.

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
# Run all test suites across Modules 1 - 6 & Module 8
$env:PYTHONPATH="backend"
python backend/tests/test_health.py
python backend/tests/test_auth.py
python backend/tests/test_classroom.py
python backend/tests/test_subject.py
python backend/tests/test_doubt.py
python backend/tests/test_lecture.py
python backend/tests/test_ai.py
python backend/tests/test_feedback.py
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
