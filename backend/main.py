import logging
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(name)s] %(message)s")

import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from backend.config import FRONTEND_URL
from backend.database import init_db
from backend.routers import profile, jobs, resume, interview, chat, voice
from backend.routers import auth, analytics
from backend.utils.api_key import verify_api_key
from backend.utils.rate_limit import limiter


@asynccontextmanager
async def lifespan(app: FastAPI):
    os.makedirs("data", exist_ok=True)
    os.makedirs("tmp", exist_ok=True)
    init_db()

    try:
        from backend.scheduler.job_scheduler import start_scheduler
        start_scheduler()
    except Exception as e:
        logger.error(f"[Main] Scheduler failed to start: {e}")

    yield

    try:
        from backend.scheduler.job_scheduler import stop_scheduler
        stop_scheduler()
    except Exception:
        pass


app = FastAPI(
    title="ATLAS API",
    description="Agentic AI Career Assistant",
    version="2.1.0",
    lifespan=lifespan,
)

# ── Rate limiter state ────────────────────────────────────────────────
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── CORS ──────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

PREFIX = "/api/v1"

# Auth & analytics — no API key required (have their own security)
app.include_router(auth.router, prefix=PREFIX)
app.include_router(analytics.router, prefix=PREFIX, dependencies=[Depends(verify_api_key)])

# Protected routes — require API key
app.include_router(profile.router, prefix=PREFIX, dependencies=[Depends(verify_api_key)])
app.include_router(jobs.router, prefix=PREFIX, dependencies=[Depends(verify_api_key)])
app.include_router(resume.router, prefix=PREFIX, dependencies=[Depends(verify_api_key)])
app.include_router(interview.router, prefix=PREFIX, dependencies=[Depends(verify_api_key)])
app.include_router(chat.router, prefix=PREFIX, dependencies=[Depends(verify_api_key)])
app.include_router(voice.router, prefix=PREFIX, dependencies=[Depends(verify_api_key)])


@app.get("/")
def health():
    return {"status": "ATLAS backend running", "version": "2.1.0"}
