from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Date
from sqlalchemy import Float as Real
from backend.database import Base


class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String, nullable=False)
    company = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    platform = Column(String, nullable=False)   # internshala / unstop / naukri
    location = Column(String, nullable=True)
    stipend_salary = Column(String, nullable=True)
    apply_link = Column(String, nullable=False)
    posted_date = Column(Date, nullable=False)
    scraped_at = Column(DateTime, default=datetime.utcnow)
    is_expired = Column(Integer, default=0)
    embedding_id = Column(String, nullable=False, default="")


class JobMatch(Base):
    __tablename__ = "job_matches"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False)
    match_score = Column(Real, nullable=False)
    match_reason = Column(Text, nullable=False, default="")
    rank = Column(Integer, nullable=False, default=0)
    served_at = Column(DateTime, default=datetime.utcnow)
    user_action = Column(String, default="pending")  # pending/saved/applied/dismissed
