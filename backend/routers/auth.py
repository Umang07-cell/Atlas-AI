"""
routers/auth.py — Signup, login, logout, password reset for Atlas.

Security:
  • Passwords hashed with bcrypt (passlib)
  • JWT access tokens (python-jose)
  • Rate limiting on sensitive endpoints
  • Login attempt logging
  • Password reset via token (in real deployment: email the link)
"""
import logging
import json
import hashlib
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, EmailStr, validator
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models.user import User
from backend.models.analytics import LoginAttempt, PasswordResetToken
from backend.utils.auth import (
    hash_password, verify_password,
    create_access_token, get_current_user,
    generate_reset_token,
)
from backend.utils.rate_limit import limiter

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["auth"])


# ── Schemas ───────────────────────────────────────────────────────────

class SignupRequest(BaseModel):
    name: str
    email: str
    password: str
    domain: Optional[str] = "Software Development"
    location: Optional[str] = ""
    experience_level: Optional[str] = "fresher"

    @validator("password")
    def password_strength(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v

    @validator("name")
    def name_not_empty(cls, v):
        if not v.strip():
            raise ValueError("Name cannot be empty")
        return v.strip()


class LoginRequest(BaseModel):
    email: str
    password: str


class PasswordResetRequest(BaseModel):
    email: str


class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str

    @validator("new_password")
    def password_strength(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

    @validator("new_password")
    def password_strength(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


# ── Helpers ───────────────────────────────────────────────────────────

def _log_attempt(db: Session, email: str, ip: str, success: bool):
    attempt = LoginAttempt(
        email=email,
        ip_address=ip,
        success=1 if success else 0,
    )
    db.add(attempt)
    try:
        db.commit()
    except Exception:
        db.rollback()


def _check_brute_force(db: Session, email: str, ip: str):
    """Block if >10 failed attempts in last 15 minutes from same IP or email."""
    window = datetime.utcnow() - timedelta(minutes=15)
    ip_fails = (
        db.query(LoginAttempt)
        .filter(
            LoginAttempt.ip_address == ip,
            LoginAttempt.success == 0,
            LoginAttempt.created_at >= window,
        )
        .count()
    )
    email_fails = (
        db.query(LoginAttempt)
        .filter(
            LoginAttempt.email == email,
            LoginAttempt.success == 0,
            LoginAttempt.created_at >= window,
        )
        .count()
    )
    if ip_fails >= 10 or email_fails >= 10:
        raise HTTPException(
            status_code=429,
            detail="Too many failed attempts. Please try again in 15 minutes.",
        )


def _get_ip(request: Request) -> str:
    fwd = request.headers.get("X-Forwarded-For")
    if fwd:
        return fwd.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


# ── Routes ────────────────────────────────────────────────────────────

@router.post("/signup", status_code=201)
@limiter.limit("10/minute")
def signup(request: Request, req: SignupRequest, db: Session = Depends(get_db)):
    """Create a new account with email + password."""
    existing = db.query(User).filter(User.email == req.email.lower()).first()
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

    user = User(
        name=req.name,
        email=req.email.lower(),
        password_hash=hash_password(req.password),
        domain=req.domain,
        location=req.location,
        experience_level=req.experience_level,
        skills="[]",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user.id, user.email)
    logger.info(f"[Auth] New signup: {user.email} (id={user.id})")

    return {
        "token": token,
        "user_id": user.id,
        "name": user.name,
        "email": user.email,
        "domain": user.domain,
        "experience_level": user.experience_level,
    }


@router.post("/login")
@limiter.limit("10/minute")
def login(request: Request, req: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate and return a JWT."""
    ip = _get_ip(request)
    _check_brute_force(db, req.email.lower(), ip)

    user = db.query(User).filter(User.email == req.email.lower()).first()

    if not user or not verify_password(req.password, user.password_hash):
        _log_attempt(db, req.email.lower(), ip, success=False)
        raise HTTPException(status_code=401, detail="Invalid email or password")

    _log_attempt(db, req.email.lower(), ip, success=True)

    user.last_login = datetime.utcnow()
    db.commit()

    token = create_access_token(user.id, user.email)
    logger.info(f"[Auth] Login: {user.email}")

    return {
        "token": token,
        "user_id": user.id,
        "name": user.name,
        "email": user.email,
        "domain": user.domain,
        "experience_level": user.experience_level,
    }


@router.post("/logout")
def logout(current_user: User = Depends(get_current_user)):
    """Stateless logout — client should discard the token."""
    logger.info(f"[Auth] Logout: {current_user.email}")
    return {"message": "Logged out successfully"}


@router.post("/password-reset/request")
@limiter.limit("5/minute")
def request_password_reset(
    request: Request,
    req: PasswordResetRequest,
    db: Session = Depends(get_db),
):
    """
    Generate a password reset token.
    In production: email the reset link. Here we return the token directly
    so you can integrate with your email provider (SendGrid, Resend, etc.).
    """
    user = db.query(User).filter(User.email == req.email.lower()).first()

    # Always return 200 — don't reveal whether email exists
    if not user:
        return {"message": "If that email exists, a reset link has been sent."}

    # Invalidate old tokens
    db.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == user.id,
        PasswordResetToken.used == 0,
    ).update({"used": 1})
    db.commit()

    token = generate_reset_token()
    expires_at = datetime.utcnow() + timedelta(hours=1)

    prt = PasswordResetToken(user_id=user.id, token=token, expires_at=expires_at)
    db.add(prt)
    db.commit()

    logger.info(f"[Auth] Password reset requested for {user.email}")

    # TODO: Send email with link like: https://yourapp.com/reset-password?token={token}
    # For development, token is returned in the response:
    return {
        "message": "If that email exists, a reset link has been sent.",
        "dev_token": token,  # REMOVE THIS in production — only for development
        "dev_note": "In production, remove dev_token and send via email",
    }


@router.post("/password-reset/confirm")
@limiter.limit("5/minute")
def confirm_password_reset(
    request: Request,
    req: PasswordResetConfirm,
    db: Session = Depends(get_db),
):
    """Verify reset token and update password."""
    prt = (
        db.query(PasswordResetToken)
        .filter(
            PasswordResetToken.token == req.token,
            PasswordResetToken.used == 0,
        )
        .first()
    )

    if not prt:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    if prt.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Reset token has expired")

    user = db.query(User).filter(User.id == prt.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.password_hash = hash_password(req.new_password)
    prt.used = 1
    db.commit()

    logger.info(f"[Auth] Password reset completed for {user.email}")
    return {"message": "Password updated successfully"}


@router.post("/change-password")
def change_password(
    req: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Change password for authenticated user."""
    if not verify_password(req.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    current_user.password_hash = hash_password(req.new_password)
    db.commit()

    logger.info(f"[Auth] Password changed for {current_user.email}")
    return {"message": "Password changed successfully"}


@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    """Return the current user's profile from their JWT."""
    return {
        "user_id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "domain": current_user.domain,
        "location": current_user.location,
        "experience_level": current_user.experience_level,
        "skills": current_user.get_skills(),
        "created_at": current_user.created_at.isoformat() if current_user.created_at else None,
    }
