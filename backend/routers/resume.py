"""
resume.py router — thin pass-through to resume_agent.full_ats_pipeline().
All logic lives in the agent. Router only handles DB fetch, validation, HTTP.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, field_validator
from backend.database import get_db
from backend.models.resume import Resume
from backend.models.user import User
from backend.agents.resume_agent import full_ats_pipeline

router = APIRouter(prefix="/resume", tags=["resume"])


class TailorRequest(BaseModel):
    jd_text: str
    user_id: int

    @field_validator("user_id")
    @classmethod
    def user_id_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError("user_id must be a positive integer")
        return v

    @field_validator("jd_text")
    @classmethod
    def jd_must_not_be_empty(cls, v):
        if not v or not v.strip():
            raise ValueError("jd_text cannot be empty")
        return v.strip()


@router.post("/tailor")
def tailor_resume_endpoint(req: TailorRequest, db: Session = Depends(get_db)):
    # Validate user exists
    user = db.query(User).filter(User.id == req.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Fetch active resume
    resume = db.query(Resume).filter(
        Resume.user_id == req.user_id,
        Resume.is_active == 1
    ).first()
    if not resume:
        raise HTTPException(
            status_code=404,
            detail="No resume found. Please upload your resume in your profile first."
        )

    # Run pipeline — all logic in agent
    try:
        result = full_ats_pipeline(resume.raw_text, req.jd_text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pipeline failed: {str(e)}")

    return result