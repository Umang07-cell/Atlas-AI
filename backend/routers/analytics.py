"""
routers/analytics.py — User event tracking and bug reports for Atlas.
"""
import logging
import json
import hashlib
from datetime import datetime, timedelta
from typing import Optional, List
from fastapi import APIRouter, Depends, Request, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.database import get_db
from backend.models.analytics import UserEvent, BugReport
from backend.utils.rate_limit import limiter

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/analytics", tags=["analytics"])


# ── Schemas ───────────────────────────────────────────────────────────

class TrackEventRequest(BaseModel):
    user_id: Optional[int] = None
    event_type: str                     # page_view | button_click | job_applied | etc.
    event_data: Optional[dict] = {}
    page: Optional[str] = None
    session_id: Optional[str] = None


class BugReportRequest(BaseModel):
    user_id: Optional[int] = None
    title: str
    description: str
    severity: Optional[str] = "medium"  # low / medium / high / critical
    category: Optional[str] = "general" # ui / api / data / performance / other
    page: Optional[str] = None
    extra_data: Optional[dict] = {}


# ── Helpers ───────────────────────────────────────────────────────────

def _hash_ip(ip: str) -> str:
    return hashlib.sha256(ip.encode()).hexdigest()[:16]


def _get_ip(request: Request) -> str:
    fwd = request.headers.get("X-Forwarded-For")
    if fwd:
        return fwd.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


# ── Routes ────────────────────────────────────────────────────────────

@router.post("/track", status_code=201)
@limiter.limit("60/minute")
def track_event(
    request: Request,
    req: TrackEventRequest,
    db: Session = Depends(get_db),
):
    """
    Track a user event (page view, button click, feature usage, etc.).
    Frontend calls this fire-and-forget.
    """
    ip = _get_ip(request)
    event = UserEvent(
        user_id=req.user_id,
        event_type=req.event_type,
        event_data=json.dumps(req.event_data or {}),
        page=req.page,
        session_id=req.session_id,
        ip_hash=_hash_ip(ip),
    )
    db.add(event)
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"[Analytics] Failed to track event: {e}")

    return {"ok": True}


@router.post("/bug-report", status_code=201)
@limiter.limit("10/minute")
def submit_bug_report(
    request: Request,
    req: BugReportRequest,
    db: Session = Depends(get_db),
):
    """Submit a bug report from the user."""
    ua = request.headers.get("User-Agent", "")

    report = BugReport(
        user_id=req.user_id,
        title=req.title[:200],
        description=req.description[:2000],
        severity=req.severity,
        category=req.category,
        page=req.page,
        user_agent=ua[:500],
        extra_data=json.dumps(req.extra_data or {}),
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    logger.info(f"[BugReport] #{report.id} from user={req.user_id}: {req.title}")
    return {"id": report.id, "message": "Bug report submitted. Thank you!"}


@router.get("/events/summary")
def get_event_summary(
    user_id: Optional[int] = None,
    days: int = 7,
    db: Session = Depends(get_db),
):
    """Get event counts grouped by type for the last N days. Admin use."""
    since = datetime.utcnow() - timedelta(days=days)
    query = db.query(
        UserEvent.event_type,
        func.count(UserEvent.id).label("count"),
    ).filter(UserEvent.created_at >= since)

    if user_id:
        query = query.filter(UserEvent.user_id == user_id)

    results = query.group_by(UserEvent.event_type).all()
    return {
        "period_days": days,
        "events": [{"type": r.event_type, "count": r.count} for r in results],
    }


@router.get("/bug-reports")
def list_bug_reports(
    status: Optional[str] = None,
    severity: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    """List bug reports — admin endpoint."""
    query = db.query(BugReport)
    if status:
        query = query.filter(BugReport.status == status)
    if severity:
        query = query.filter(BugReport.severity == severity)
    reports = query.order_by(BugReport.created_at.desc()).limit(limit).all()
    return [
        {
            "id": r.id,
            "user_id": r.user_id,
            "title": r.title,
            "description": r.description,
            "severity": r.severity,
            "category": r.category,
            "page": r.page,
            "status": r.status,
            "created_at": r.created_at.isoformat(),
        }
        for r in reports
    ]
