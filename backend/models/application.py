from datetime import datetime, timedelta
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Boolean
from backend.database import Base


class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False)
    status = Column(String, default="applied")   # applied/viewed/interview/offer/rejected
    applied_at = Column(DateTime, default=datetime.utcnow)
    follow_up_date = Column(DateTime, nullable=False, default=lambda: datetime.utcnow() + timedelta(days=7))
    notes = Column(Text, nullable=True)
    cover_letter_used = Column(Text, nullable=True)


