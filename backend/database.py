import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from backend.config import DATABASE_URL

# Ensure data directory exists
os.makedirs("data", exist_ok=True)

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {},
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _migrate_interview_sessions():
    """Add new columns to existing SQLite DBs without Alembic."""
    import sqlite3
    if "sqlite" not in DATABASE_URL:
        return
    db_path = DATABASE_URL.replace("sqlite:///", "")
    if not os.path.exists(db_path):
        return
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute("PRAGMA table_info(interview_sessions)")
    existing = {row[1] for row in cur.fetchall()}
    migrations = [
        ("duration_minutes", "INTEGER DEFAULT 20"),
        ("memory_summary", "TEXT DEFAULT ''"),
        ("memory_facts", "TEXT DEFAULT '{}'"),
        ("started_at", "DATETIME"),
    ]
    for col, col_type in migrations:
        if col not in existing:
            cur.execute(f"ALTER TABLE interview_sessions ADD COLUMN {col} {col_type}")
    conn.commit()
    conn.close()


def init_db():
    from backend.models import user, resume, job, application, chat  # noqa
    from backend.models import analytics  # noqa — UserEvent, BugReport, LoginAttempt, PasswordResetToken
    Base.metadata.create_all(bind=engine)
    _migrate_interview_sessions()
