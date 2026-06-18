import json
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text
from backend.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    skills = Column(Text, default="[]")          # JSON array stored as text
    domain = Column(String, nullable=False, default="")
    location = Column(String, nullable=False, default="")
    experience_level = Column(String, default="fresher")
    schedule_time = Column(String, default="10:00")
    schedule_active = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)

    def get_skills(self):
        try:
            return json.loads(self.skills)
        except Exception:
            return []

    def set_skills(self, skills_list):
        self.skills = json.dumps(skills_list)
