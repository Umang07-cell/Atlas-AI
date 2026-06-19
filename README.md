<div align="center">

<img src="https://img.shields.io/badge/Atlas-AI%20Career%20OS-6366f1?style=for-the-badge&logoColor=white" />

# ATLAS — AI Career Operating System

**An end-to-end AI-powered career platform built for Indian freshers and junior developers.**  
Smart job matching · ATS resume tailoring · Voice mock interviews · AI career chat

[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
[![Groq](https://img.shields.io/badge/Groq-LLaMA%203.3%2070B-f97316?style=flat-square)](https://groq.com)
[![Cerebras](https://img.shields.io/badge/Cerebras-Llama%203.1-8b5cf6?style=flat-square)](https://cerebras.ai)
[![SQLite](https://img.shields.io/badge/SQLite-Local%20DB-003B57?style=flat-square&logo=sqlite&logoColor=white)](https://sqlite.org)
[![ChromaDB](https://img.shields.io/badge/ChromaDB-Vector%20Store-orange?style=flat-square)](https://www.trychroma.com)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

</div>

---

## What is ATLAS?

ATLAS is a full-stack AI career platform designed specifically for freshers and junior engineers in India. It aggregates real job listings from Internshala, Unstop, and JSearch, matches them to your resume using vector similarity, tailors your resume to any JD using a 5-step ATS pipeline, runs voice-first mock interviews with a human-like AI interviewer, and gives you a career chat agent that knows your profile.

Everything runs locally — no paid hosting required.

---

## Features

### 🎯 Smart Job Feed
- Scrapes **Internshala**, **Unstop**, and **JSearch (RapidAPI)** in parallel
- Deduplication via MD5 hash on title + company
- 7-day recency filter — no stale listings
- Vector-based job matching against your uploaded resume using ChromaDB + HuggingFace embeddings
- APScheduler auto-scrape every 6 hours in the background
- Filter by platform, search by role/company/location

### 📄 Resume Studio (5-step ATS Pipeline)
1. **Keyword extraction** — pulls atomic skill tokens from the JD
2. **Original ATS score** — scores your current resume against the JD
3. **Resume tailoring** — rewrites your resume to match the JD (locked 1-page template)
4. **Re-score** — rescores the tailored version with identical truncation
5. **Cover letter** — generates a grounded, no-hallucination cover letter

Shows missing keywords, already-matched keywords, before/after ATS score comparison.

### 🎙 Voice Mock Interview
- Selectable level (Fresher / Junior / Experienced) and duration (15 / 20 / 30 min)
- 6-phase interview: Introduction → Background → Technical → Behavioral → HR → Closing
- Voice-first: AI speaks questions via gTTS, listens via MediaRecorder + Whisper transcription
- Auto silence detection — stops recording after 1.8s of silence
- Background memory writes to keep latency under 1.5s per turn
- Post-interview report: Overall score, Technical / Communication / Confidence breakdown, Strengths, Improvements, Verdict

### 🤖 ATLAS Chat
- Groq LLaMA 3.3 70B — career-focused conversational AI
- Knows your profile: domain, skills, experience level, location
- Persistent chat history per user in SQLite
- Handles: job search strategy, salary negotiation, cold emails, LinkedIn optimization, skill roadmaps

### 🎤 Voice Mode
- Voice navigation — say "Show me jobs", "Start mock interview", "Chat with ATLAS"
- Intent detection routes you to the correct page
- Responds with spoken audio

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, Framer Motion |
| **Backend** | FastAPI, SQLAlchemy, Uvicorn |
| **LLM — Chat & Resume** | Groq API (LLaMA 3.3 70B) |
| **LLM — Interview** | Cerebras API (LLaMA 3.1) |
| **Vector Store** | ChromaDB + HuggingFace sentence-transformers |
| **Database** | SQLite (local) |
| **Voice — STT** | Whisper (via Groq) |
| **Voice — TTS** | gTTS / edge-tts |
| **Scraping** | Internshala (HTML), Unstop (API), JSearch (RapidAPI) |
| **Scheduling** | APScheduler |
| **Auth** | JWT (PyJWT) + API key middleware |

---

## Project Structure

```
Atlas/
├── backend/
│   ├── agents/
│   │   ├── chat_agent.py          # Career conversational AI (Groq)
│   │   ├── interview_agent.py     # Interview question generation (Cerebras)
│   │   ├── interview_orchestrator.py  # Phase management, memory, timing
│   │   ├── interview_analyzer.py  # Post-interview scoring & feedback
│   │   ├── interview_memory.py    # Per-turn memory persistence
│   │   ├── resume_agent.py        # 5-step ATS pipeline (Groq)
│   │   ├── voice_agent.py         # STT + TTS + intent detection
│   │   ├── llm.py                 # Groq & Cerebras wrappers
│   │   ├── job_hunt_agent.py      # Job matching logic
│   │   ├── task_agent.py          # Background task agent
│   │   └── tracker_agent.py       # Application tracker
│   ├── routers/
│   │   ├── profile.py             # POST /users, GET /users/{id}
│   │   ├── jobs.py                # GET /jobs/feed, POST /jobs/scrape
│   │   ├── resume.py              # POST /resume/tailor, POST /resume/upload
│   │   ├── interview.py           # POST /interview/start, /send, /end
│   │   ├── chat.py                # POST /chat/send, GET /chat/history
│   │   └── voice.py               # POST /voice/transcribe, /speak
│   ├── scrapers/
│   │   ├── internshala.py         # Internshala scraper
│   │   ├── unstop.py              # Unstop API scraper
│   │   └── jsearch_scraper.py     # JSearch (RapidAPI) scraper
│   ├── memory/
│   │   └── matcher.py             # ChromaDB vector store + job matcher
│   ├── models/                    # SQLAlchemy ORM models
│   ├── scheduler/
│   │   └── job_scheduler.py       # APScheduler — auto scrape every 6h
│   ├── utils/
│   │   ├── api_key.py             # API key middleware
│   │   └── date_filter.py         # 7-day recency filter
│   ├── database.py                # SQLite init + session
│   ├── config.py                  # ENV var loading
│   └── main.py                    # FastAPI app, CORS, router registration
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Landing.jsx        # Animated starfield hero
│   │   │   ├── Dashboard.jsx      # Stats, skills, top jobs, quick actions
│   │   │   ├── JobFeed.jsx        # Full job feed with filters
│   │   │   ├── ResumeStudio.jsx   # ATS pipeline UI
│   │   │   ├── InterviewPrep.jsx  # Voice interview room
│   │   │   ├── ChatPage.jsx       # ATLAS chat UI
│   │   │   ├── Setup.jsx          # Onboarding flow
│   │   │   └── VoiceMode.jsx      # Voice navigation
│   │   ├── components/
│   │   │   ├── Layout.jsx         # Sidebar + nav
│   │   │   ├── ATSMeter.jsx       # ATS score ring
│   │   │   ├── JobCard.jsx        # Job listing card
│   │   │   └── PageTransition.jsx # Route animations
│   │   ├── api/                   # Axios API client
│   │   └── index.css              # Design system (glass, tokens, animations)
│   ├── package.json
│   └── vite.config.js
├── data/                          # SQLite DB + ChromaDB (auto-created)
├── .env
└── requirements.txt
```

---

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- A [Groq API key](https://console.groq.com) (free)
- A [Cerebras API key](https://cloud.cerebras.ai) (free)
- A [RapidAPI key](https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch) for JSearch (free tier)

### 1. Clone & install

```bash
git clone https://github.com/yourusername/atlas.git
cd atlas
```

**Backend:**
```bash
pip install -r requirements.txt
```

**Frontend:**
```bash
cd frontend
npm install
```

### 2. Configure environment

Create `.env` in the `Atlas/` root:

```env
# LLM
GROQ_API_KEY=your_groq_api_key
CEREBRAS_API_KEY=your_cerebras_api_key

# JSearch (RapidAPI)
RAPIDAPI_KEY=your_rapidapi_key

# Auth
JWT_SECRET=your_secret_key_here
JWT_ALGORITHM=HS256
JWT_EXPIRY_HOURS=24

# Database (SQLite — no setup needed)
DATABASE_URL=sqlite:///./data/atlas.db
CHROMA_PATH=./data/chroma

# Scheduler
DEFAULT_SCHEDULE_TIME=10:00

# CORS
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:8000

# App
APP_API_KEY=your_app_api_key
ENVIRONMENT=development
```

### 3. Run

**Backend** (from `Atlas/` directory):
```bash
uvicorn backend.main:app --reload --port 8000
```

**Frontend** (from `Atlas/frontend/` directory):
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/users` | Create user profile |
| `GET` | `/api/v1/users/{id}` | Get user profile |
| `POST` | `/api/v1/users/{id}/resume` | Upload resume PDF |
| `GET` | `/api/v1/jobs/feed` | Get job feed (with match scores) |
| `POST` | `/api/v1/jobs/scrape` | Trigger manual scrape |
| `POST` | `/api/v1/resume/tailor` | Run ATS pipeline |
| `POST` | `/api/v1/interview/start` | Start interview session |
| `POST` | `/api/v1/interview/send` | Send interview answer |
| `POST` | `/api/v1/interview/end` | End session + get feedback |
| `GET` | `/api/v1/interview/sessions` | List past sessions |
| `POST` | `/api/v1/chat/send` | Send chat message |
| `GET` | `/api/v1/chat/history` | Get chat history |
| `DELETE` | `/api/v1/chat/history` | Clear chat history |
| `POST` | `/api/v1/voice/transcribe` | Transcribe audio + detect intent |
| `POST` | `/api/v1/voice/speak` | Text to speech |

Full interactive docs at [http://localhost:8000/docs](http://localhost:8000/docs)

---

## Known Issues & Fixes

**LLM returning plain text instead of JSON**

`backend/agents/llm.py` `_parse_json()` crashes when the model responds conversationally. Fix:

```python
def _parse_json(raw):
    try:
        return json.loads(raw)
    except (json.JSONDecodeError, ValueError):
        import re
        match = re.search(r'\{.*\}', raw, re.DOTALL)
        if match:
            return json.loads(match.group())
        return {"message": raw, "response": raw}
```

---

## Roadmap

- [ ] LinkedIn OAuth login
- [ ] Application tracker (saved jobs, status pipeline)
- [ ] Daily AI briefing — personalized job digest
- [ ] Resume PDF export
- [ ] Multi-language support (Hindi)
- [ ] Deployment on Render / Railway

---

## Built With

- [FastAPI](https://fastapi.tiangolo.com) — backend framework
- [Groq](https://groq.com) — ultra-fast LLaMA 3.3 70B inference
- [Cerebras](https://cerebras.ai) — LLaMA 3.1 for interview AI
- [ChromaDB](https://www.trychroma.com) — vector store for job matching
- [React + Vite](https://vitejs.dev) — frontend
- [Framer Motion](https://www.framer.com/motion) — animations
- [Tailwind CSS](https://tailwindcss.com) — styling

---

## Author

**Umang Pawar**  
Data Analytics · AI/ML Engineering · G.H. Raisoni College  
[LinkedIn](https://linkedin.com/in/yourprofile) · [GitHub](https://github.com/yourusername)

---

<div align="center">
  <sub>Built for Indian freshers navigating a tough job market. Good luck. 🚀</sub>
</div>