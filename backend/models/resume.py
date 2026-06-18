import json
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from backend.database import Base


class Resume(Base):
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    filename = Column(String, nullable=False)
    raw_text = Column(Text, nullable=False)
    parsed_skills = Column(Text, default="[]")
    parsed_experience = Column(Text, default="{}")
    embedding_id = Column(String, nullable=False, default="")
    is_active = Column(Integer, default=1)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    def get_parsed_skills(self):
        try:
            return json.loads(self.parsed_skills)
        except Exception:
            return []

    def get_parsed_experience(self):
        try:
            return json.loads(self.parsed_experience)
        except Exception:
            return {}
