# ATLAS — Agentic AI Career & Life Assistant

> Voice-powered AI that hunts jobs, tailors your resume, preps you for interviews, and manages your day — built for Indian students and freshers. ₹0 cost.

**Live stack:** Gemini Flash · FastAPI · React · ChromaDB · Faster-Whisper · Edge-TTS

---

## Features

| Feature | What it does |
|---|---|
| **Job Scraping** | Scrapes Internshala, Unstop, Naukri daily. Only jobs posted in last 3 days. |
| **AI Job Matching** | Matches jobs to your resume using vector similarity (sentence-transformers + ChromaDB) |
| **ATS Resume Tailoring** | Scores your resume vs a JD, rewrites bullets, generates a cover letter |
| **Interview Prep** | 15 questions (Technical / Behavioral / Role-Specific) from any JD |
| **Application Tracker** | Kanban board with drag-to-update, 7-day follow-up reminders |
| **Daily Briefing** | Morning voice briefing with your tasks + job matches via Edge-TTS |
| **Voice Mode** | Offline STT via Faster-Whisper, full conversation interface |
| **Task Manager** | AI-prioritised task list with voice input support |

---

## Local Development

### Prerequisites
- Python 3.11+
- Node.js 18+
- A Gemini API key (free at [aistudio.google.com](https://aistudio.google.com))

### 1. Clone and set up environment

```bash
git clone https://github.com/YOUR_USERNAME/atlas.git
cd atlas

# Copy and fill in your API key
cp .env .env.local
# Edit .env and set GEMINI_API_KEY
```

### 2. Backend

```bash
# Install Python dependencies
pip install -r requirements.txt

# Start the backend
uvicorn backend.main:app --reload --port 8000
```

The backend will:
- Create `data/atlas.db` (SQLite) on first run
- Create `data/chroma/` (vector store) on first run
- Start APScheduler (scrape 6am, match 7am, briefing 8am, follow-up 9am)
- Serve API docs at http://localhost:8000/docs

### 3. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Copy env
cp .env.example .env.local
# VITE_API_URL is already set to localhost:8000 in .env.example

# Start dev server
npm run dev
```

Frontend runs at http://localhost:5173

---

## Render Deployment

### One-click deploy

1. Push the repo to GitHub
2. Go to [render.com](https://render.com) → New → Blueprint
3. Connect your GitHub repo
4. Render will detect `render.yaml` and create both services automatically

### Manual environment variables to set in Render dashboard

**Backend service (`atlas-backend`):**
| Variable | Value |
|---|---|
| `GEMINI_API_KEY` | Your Gemini API key from aistudio.google.com |
| `FRONTEND_URL` | Your Render frontend URL (e.g. `https://atlas-frontend.onrender.com`) |

**Frontend service (`atlas-frontend`):**
| Variable | Value |
|---|---|
| `VITE_API_URL` | Your Render backend URL + `/api/v1` (e.g. `https://atlas-backend.onrender.com/api/v1`) |

> **Note:** The backend uses a 1GB persistent disk mounted at `/data` — this is where SQLite and ChromaDB are stored across restarts. Render's free tier includes this.

### Render free tier limits to know
- Backend spins down after 15 min of inactivity (cold start ~30s)
- 750 hours/month compute — enough for one service running full time
- 1GB disk is persistent across deploys

---

## Project Structure

```
atlas/
├── backend/
│   ├── agents/          # 6 AI agents (task, resume, job, voice, interview, tracker)
│   ├── memory/          # ChromaDB client, embeddings, matcher
│   ├── models/          # SQLAlchemy ORM models (9 tables)
│   ├── routers/         # FastAPI routers (23 endpoints)
│   ├── scheduler/       # APScheduler jobs (scrape, match, briefing, follow-up)
│   ├── scrapers/        # Internshala, Unstop, Naukri scrapers
│   ├── utils/           # PDF parser, JWT, date filter, ICS generator
│   ├── config.py
│   ├── database.py
│   └── main.py
├── frontend/
│   └── src/
│       ├── api/         # Axios client + all API calls
│       ├── components/  # Layout, JobCard, ATSMeter, VoiceButton, TaskList, KanbanBoard
│       └── pages/       # Login, Onboarding, Dashboard, JobFeed, ResumeStudio,
│                        # InterviewPrep, AppTracker, VoiceMode
├── data/                # SQLite + ChromaDB (gitignored)
├── render.yaml          # Render Blueprint deployment config
├── requirements.txt
└── .env
```

---

## API Reference

Full interactive docs at `/docs` when the backend is running.

Key endpoints:
- `POST /api/v1/auth/register` — Create account
- `POST /api/v1/auth/login` — Get JWT token
- `POST /api/v1/profile/resume` — Upload + parse PDF resume
- `GET /api/v1/jobs/matches` — Get AI-matched jobs for today
- `POST /api/v1/resume/tailor` — Full ATS pipeline (score + tailor + cover letter)
- `POST /api/v1/interview/questions` — Generate 15 interview questions from JD
- `POST /api/v1/voice/transcribe` — Offline STT via Faster-Whisper
- `POST /api/v1/voice/speak` — TTS via Edge-TTS

---

## Skills Taught by This Project

Web scraping · Agentic AI · Voice AI (STT + TTS) · RAG · LLM prompt engineering · FastAPI · React · SQLite schema design · Vector databases (ChromaDB) · APScheduler · JWT auth · Render deployment

---

## Tech Stack

| Layer | Technology | Cost |
|---|---|---|
| LLM | Gemini Flash 2.0 (1,500 req/day free) | Free |
| Embeddings | sentence-transformers all-MiniLM-L6-v2 | Free |
| Vector DB | ChromaDB (local) | Free |
| STT | Faster-Whisper tiny (CPU, offline) | Free |
| TTS | Edge-TTS (Microsoft neural voices) | Free |
| Backend | FastAPI + Python 3.11 | Free |
| Frontend | React 18 + Vite + Tailwind | Free |
| Database | SQLite | Free |
| Hosting | Render free tier | Free |

**Total: ₹0**
