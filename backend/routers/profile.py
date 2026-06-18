import logging
logger = logging.getLogger(__name__)

import os, json, uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from backend.database import get_db
from backend.models.user import User
from backend.models.resume import Resume
from backend.utils.pdf_parser import extract_text_from_pdf
from backend.memory.matcher import store_resume_vector
from backend.agents.llm import call_groq_json

router = APIRouter(prefix="/profile", tags=["profile"])


class ProfileCreate(BaseModel):
    name: str
    email: Optional[str] = ""
    skills: Optional[List[str]] = []
    domain: str          # no default
    location: Optional[str] = "India"
    experience_level: str  # no default


class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    skills: Optional[List[str]] = None
    domain: Optional[str] = None
    location: Optional[str] = None
    experience_level: Optional[str] = None


def get_or_create_user(user_id: int, db: Session) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.post("/create", status_code=201)
def create_profile(req: ProfileCreate, db: Session = Depends(get_db)):
    """Create a new user profile (no auth required)."""
    user = User(
        name=req.name,
        email=req.email or f"user_{uuid.uuid4().hex[:8]}@atlas.local",
        password_hash="no-auth",
        domain=req.domain,
        location=req.location,
        experience_level=req.experience_level,
    )
    user.set_skills(req.skills or [])
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"user_id": user.id, "name": user.name}


@router.get("/{user_id}")
def get_profile(user_id: int, db: Session = Depends(get_db)):
    user = get_or_create_user(user_id, db)
    resume = db.query(Resume).filter(Resume.user_id == user_id, Resume.is_active == 1).first()
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "skills": user.get_skills(),
        "domain": user.domain,
        "location": user.location,
        "experience_level": user.experience_level,
        "schedule_time": user.schedule_time,
        "has_resume": resume is not None,
    }


@router.put("/{user_id}")
def update_profile(user_id: int, req: ProfileUpdate, db: Session = Depends(get_db)):
    user = get_or_create_user(user_id, db)
    if req.name: user.name = req.name
    if req.skills is not None: user.set_skills(req.skills)
    if req.domain: user.domain = req.domain
    if req.location: user.location = req.location
    if req.experience_level: user.experience_level = req.experience_level
    db.commit()
    return {"message": "Profile updated"}


@router.post("/{user_id}/resume")
async def upload_resume(user_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files accepted")
    user = get_or_create_user(user_id, db)
    os.makedirs("tmp", exist_ok=True)
    tmp_path = f"tmp/resume_{user_id}_{uuid.uuid4().hex}.pdf"
    try:
        contents = await file.read()
        with open(tmp_path, "wb") as f:
            f.write(contents)
        raw_text = extract_text_from_pdf(tmp_path)

        parse_prompt = f"""Extract structured data from this resume. Return ONLY JSON:
{{"name":"","email":"","phone":"","skills":[],"experience":[{{"company":"","role":"","duration":""}}],"education":[{{"degree":"","institution":"","year":""}}],"summary":""}}
RESUME:\n{raw_text[:4000]}"""

        try:
            parsed = call_groq_json(parse_prompt)
        except Exception:
            parsed = {"skills": [], "experience": [], "education": [], "summary": ""}

        db.query(Resume).filter(Resume.user_id == user_id).update({"is_active": 0})
        embedding_id = f"resume_{user_id}_{uuid.uuid4().hex}"
        resume = Resume(
            user_id=user_id, filename=file.filename, raw_text=raw_text,
            parsed_skills=json.dumps(parsed.get("skills", [])),
            parsed_experience=json.dumps(parsed.get("experience", [])),
            embedding_id=embedding_id, is_active=1,
        )
        db.add(resume)
        db.commit()
        try:
            store_resume_vector(embedding_id, raw_text, user_id)
        except Exception as e:
            logger.error(f"[Resume] Vector store failed: {e}")

        existing_skills = user.get_skills()
        merged = list(set(existing_skills + parsed.get("skills", [])))
        user.set_skills(merged)
        db.commit()
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

    return {"message": "Resume uploaded", "parsed_skills": parsed.get("skills", []), "resume_id": resume.id}
