"""
analytics.py — SQLAlchemy models for user event tracking and bug reports.
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, Float
from backend.database import Base


class UserEvent(Base):
    """Tracks user actions for product analytics."""
    __tablename__ = "user_events"

    id         = Column(Integer, primary_key=True, autoincrement=True)
    user_id    = Column(Integer, nullable=True)          # nullable for anon events
    event_type = Column(String, nullable=False)          # e.g. "page_view", "job_applied"
    event_data = Column(Text, default="{}")              # JSON metadata
    page       = Column(String, nullable=True)           # current page path
    session_id = Column(String, nullable=True)           # frontend session UUID
    ip_hash    = Column(String, nullable=True)           # hashed IP for deduplication
    created_at = Column(DateTime, default=datetime.utcnow)


class BugReport(Base):
    """Stores user-submitted bug reports."""
    __tablename__ = "bug_reports"

    id          = Column(Integer, primary_key=True, autoincrement=True)
    user_id     = Column(Integer, nullable=True)
    title       = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    severity    = Column(String, default="medium")       # low / medium / high / critical
    category    = Column(String, default="general")      # ui / api / data / performance / other
    page        = Column(String, nullable=True)          # page where bug occurred
    user_agent  = Column(String, nullable=True)
    extra_data  = Column(Text, default="{}")             # JSON: stack trace, repro steps
    status      = Column(String, default="open")         # open / investigating / resolved
    created_at  = Column(DateTime, default=datetime.utcnow)


class LoginAttempt(Base):
    """Tracks login attempts for security monitoring."""
    __tablename__ = "login_attempts"

    id         = Column(Integer, primary_key=True, autoincrement=True)
    email      = Column(String, nullable=False)
    ip_address = Column(String, nullable=True)
    success    = Column(Integer, default=0)              # 0 = failed, 1 = success
    created_at = Column(DateTime, default=datetime.utcnow)


class PasswordResetToken(Base):
    """Stores one-time password reset tokens."""
    __tablename__ = "password_reset_tokens"

    id         = Column(Integer, primary_key=True, autoincrement=True)
    user_id    = Column(Integer, nullable=False)
    token      = Column(String, nullable=False, unique=True)
    expires_at = Column(DateTime, nullable=False)
    used       = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
