from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from backend.database import Base


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    role = Column(String, nullable=False)   # user | assistant
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    jd_text = Column(Text, nullable=False)
    level = Column(String, default="fresher")   # fresher | junior | experienced
    phase = Column(String, default="intro")
    messages = Column(Text, default="[]")       # JSON array of {role, content}
    score = Column(String, nullable=True)
    feedback = Column(Text, nullable=True)
    duration_minutes = Column(Integer, default=20)
    memory_summary = Column(Text, default="")
    memory_facts = Column(Text, default="{}")
    started_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
