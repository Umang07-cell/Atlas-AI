import logging
logger = logging.getLogger(__name__)

from datetime import datetime
from backend.database import SessionLocal
from backend.models.user import User
from backend.models.resume import Resume
from backend.models.job import JobMatch
from backend.agents.job_hunt_agent import get_matches_for_user


def run_daily_match():
    logger.info(f"[Matcher] Starting daily match at {datetime.utcnow()}")
    db = SessionLocal()

    try:
        users = db.query(User).filter(User.schedule_active == 1).all()

        for user in users:
            resume = db.query(Resume).filter(
                Resume.user_id == user.id,
                Resume.is_active == 1,
            ).first()

            if not resume or not resume.embedding_id:
                continue

            user_profile = {
                "domain": user.domain,
                "location": user.location,
                "experience_level": user.experience_level,
                "skills": user.get_skills(),
            }

            try:
                matches = get_matches_for_user(resume.embedding_id, user_profile)
            except Exception as e:
                logger.error(f"[Matcher] Failed for user {user.id}: {e}")
                continue

            for m in matches:
                match = JobMatch(
                    user_id=user.id,
                    job_id=m["job_id"],
                    match_score=0.0,
                    match_reason=m.get("match_reason", ""),
                    rank=m.get("rank", 0),
                )
                db.add(match)

        db.commit()
        logger.info("[Matcher] Done.")

    except Exception as e:
        logger.error(f"[Matcher] Fatal error: {e}")
        db.rollback()
    finally:
        db.close()
