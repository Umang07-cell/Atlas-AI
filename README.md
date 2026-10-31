# ATLAS — AI Career Operating System

**An end-to-end AI career platform for Indian freshers and junior developers.**
Smart job matching · ATS resume tailoring · Voice mock interviews · AI career chat

**Live demo:** https://atlas-frontend-uo1y.onrender.com/chat
*(Hosted on a free tier, so the first load can take up to a minute while the server wakes up.)*

---

## What is ATLAS?

ATLAS combines **four integrated AI systems** in one deployed product: a job feed with vector matching, a 5-step ATS resume pipeline, a voice mock-interview engine, and a career chat. It also includes a multi-agent workflow with MCP tool integrations and a LoRA fine-tuned Llama 3 for interview follow-ups.


ATLAS aggregates real job listings from Internshala, Unstop, and JSearch, matches them to your resume using vector similarity, tailors your resume to any job description with a 5-step ATS pipeline, runs voice-first mock interviews with an AI interviewer, and offers a career chat that knows your profile.

## Features

### Smart Job Feed
- Scrapes **Internshala**, **Unstop**, and **JSearch (RapidAPI)** in parallel (JSearch returns about 8-10 jobs per run)
- Deduplicates listings with an MD5 hash on title + company
- 7-day recency filter, so no stale listings
- Vector-based job matching against your uploaded resume (ChromaDB + HuggingFace embeddings)
- APScheduler auto-scrape every 6 hours
- Filter by platform, role, company, or location

### Resume Studio (5-step ATS pipeline)
1. **Keyword extraction** from the job description
2. **Original ATS score** of your current resume
3. **Resume tailoring** to the JD (locked 1-page template)
4. **Re-score** of the tailored version
5. **Cover letter** generation, grounded in your resume

Shows matched and missing keywords and a before/after score comparison.

### Voice Mock Interview
- Level (Fresher / Junior / Experienced) and duration (15 / 20 / 30 min)
- 6 phases: Introduction, Background, Technical, Behavioral, HR, Closing
- Voice-first: gTTS speaks the questions; MediaRecorder + Whisper transcribe your answers
- Automatic silence detection (stops after 1.8 s of silence)
- Background memory writes keep per-turn latency low
- Post-interview report: overall score, technical / communication / confidence breakdown, strengths, improvements, verdict

### ATLAS Chat
- Career-focused RAG chat on Groq Llama 3.3 70B, grounded in your stored profile and resume
- Uses your profile (domain, skills, experience level, location)
- Persistent per-user chat history
- Covers job-search strategy, salary negotiation, cold emails, LinkedIn, and skill roadmaps

### Voice Mode
- Voice navigation ("Show me jobs", "Start mock interview")
- Intent detection routes you to the right page and replies with audio

## Multi-Agent Architecture

The backend is split into specialised agents under `backend/agents/`:

| Agent | Role |
|---|---|
| `interview_agent` | Generates interview questions (Cerebras Llama 3.1) |
| Follow-up agent | Generates context-aware follow-up questions from each answer (LoRA fine-tuned Llama 3; GPT-OSS 20B on Groq) |
| `interview_orchestrator` | Manages phases, per-turn memory, and timing |
| `interview_analyzer` | Feedback agent: scores the session and gives performance-based feedback |
| `resume_agent` | Runs the 5-step ATS pipeline (Groq) |
| `chat_agent` | Career conversation (Groq) |
| `voice_agent` | Speech-to-text, text-to-speech, intent detection |
| `job_hunt_agent` | Job matching logic |

## MCP Tool Integration

The agents call external tools through **MCP (Model Context Protocol)**. The MCP tools expose two capabilities: **job search** and **ATS resume scoring**.

## Fine-Tuned Model

Llama 3 was fine-tuned with **LoRA** on a public Kaggle dataset and is used for interview follow-up question generation, alongside the hosted models.

## Performance

- Response latency reduced from about **4-5 s to about 2 s**
- Background memory writes during interviews keep per-turn latency low

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Framer Motion |
| Backend | FastAPI, SQLAlchemy, Uvicorn |
| LLM: chat and resume | Groq API (Llama 3.3 70B) |
| LLM: interview | Cerebras API (Llama 3.1) |
| Vector store | ChromaDB + HuggingFace sentence-transformers |
| Database | SQLite (local) / PostgreSQL (deployed) |
| Voice | Whisper via Groq (STT), gTTS / edge-tts (TTS) |
| Scraping | Internshala (HTML), Unstop (API), JSearch (RapidAPI) |
| Scheduling | APScheduler |
| Agent tools | MCP (Model Context Protocol): job search and ATS resume scoring |
| LLM: follow-ups | LoRA fine-tuned Llama 3; GPT-OSS 20B (Groq) |
| Auth | JWT + API key middleware |
| Hosting | Render |

## Getting Started

**Prerequisites:** Python 3.11+, Node.js 18+, a [Groq API key](https://console.groq.com), a [Cerebras API key](https://cloud.cerebras.ai), a [RapidAPI key](https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch) for JSearch.

```bash
git clone https://github.com/Umang07-cell/Atlas-AI.git
cd Atlas-AI
pip install -r requirements.txt
cd frontend && npm install
```

Create a `.env` in the project root:

```
GROQ_API_KEY=your_groq_api_key
CEREBRAS_API_KEY=your_cerebras_api_key
RAPIDAPI_KEY=your_rapidapi_key
JWT_SECRET=your_secret_key_here
JWT_ALGORITHM=HS256
JWT_EXPIRY_HOURS=24
DATABASE_URL=sqlite:///./data/atlas.db
CHROMA_PATH=./data/chroma
DEFAULT_SCHEDULE_TIME=10:00
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:8000
APP_API_KEY=your_app_api_key
ENVIRONMENT=development
```

Run the backend from the project root and the frontend from `frontend/`:

```bash
uvicorn backend.main:app --reload --port 8000
npm run dev
```

Open http://localhost:5173. Interactive API docs are at http://localhost:8000/docs.

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/users` | Create user profile |
| GET | `/api/v1/users/{id}` | Get user profile |
| POST | `/api/v1/users/{id}/resume` | Upload resume PDF |
| GET | `/api/v1/jobs/feed` | Job feed with match scores |
| POST | `/api/v1/jobs/scrape` | Trigger a manual scrape |
| POST | `/api/v1/resume/tailor` | Run the ATS pipeline |
| POST | `/api/v1/interview/start` | Start an interview session |
| POST | `/api/v1/interview/send` | Send an interview answer |
| POST | `/api/v1/interview/end` | End session and get feedback |
| GET | `/api/v1/interview/sessions` | List past sessions |
| POST | `/api/v1/chat/send` | Send a chat message |
| GET | `/api/v1/chat/history` | Get chat history |
| DELETE | `/api/v1/chat/history` | Clear chat history |
| POST | `/api/v1/voice/transcribe` | Transcribe audio and detect intent |
| POST | `/api/v1/voice/speak` | Text to speech |

## Known Issues

**LLM returns plain text instead of JSON.** `_parse_json()` in `backend/agents/llm.py` fails when the model replies conversationally. Fallback: extract the first `{...}` block with a regex and wrap plain text as `{"message": raw, "response": raw}`.

## Roadmap

- [x] Deployment on Render
- [ ] LinkedIn OAuth login
- [ ] Application tracker (saved jobs, status pipeline)
- [ ] Daily AI briefing
- [ ] Resume PDF export
- [ ] Hindi support

## Author

**Umang Pawar** · AI/ML Engineering · G.H. Raisoni University
[LinkedIn](https://www.linkedin.com/in/umang-pawar-208157314) · [GitHub](https://github.com/Umang07-cell)