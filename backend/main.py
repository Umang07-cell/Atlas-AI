import logging
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(name)s] %(message)s")

import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from backend.config import FRONTEND_URL
from backend.database import init_db
from backend.routers import profile, jobs, resume, interview, chat, voice
from backend.utils.api_key import verify_api_key


@asynccontextmanager
async def lifespan(app: FastAPI):
    os.makedirs("data", exist_ok=True)
    os.makedirs("tmp", exist_ok=True)
    init_db()

    # ── START SCHEDULER (was missing — this is the bug fix) ─────────────────
    try:
        from backend.scheduler.job_scheduler import start_scheduler
        start_scheduler()
    except Exception as e:
        logger.error(f"[Main] Scheduler failed to start: {e}")

    yield

    # ── SHUTDOWN ─────────────────────────────────────────────────────────────
    try:
        from backend.scheduler.job_scheduler import stop_scheduler
        stop_scheduler()
    except Exception:
        pass


app = FastAPI(
    title="ATLAS API",
    description="Agentic AI Career Assistant",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

PREFIX = "/api/v1"
app.include_router(profile.router, prefix=PREFIX, dependencies=[Depends(verify_api_key)])
app.include_router(jobs.router, prefix=PREFIX, dependencies=[Depends(verify_api_key)])
app.include_router(resume.router, prefix=PREFIX, dependencies=[Depends(verify_api_key)])
app.include_router(interview.router, prefix=PREFIX, dependencies=[Depends(verify_api_key)])
app.include_router(chat.router, prefix=PREFIX, dependencies=[Depends(verify_api_key)])
app.include_router(voice.router, prefix=PREFIX, dependencies=[Depends(verify_api_key)])


@app.get("/")
def health():
    return {"status": "ATLAS backend running", "version": "2.0.0"}