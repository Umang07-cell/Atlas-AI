import logging
logger = logging.getLogger(__name__)

import hashlib
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models.job import Job
from backend.models.user import User
from backend.models.resume import Resume
from backend.scrapers.internshala import IntershalaScraper
from backend.scrapers.unstop import UnstopScraper
from backend.scrapers.jsearch_scraper import JSearchScraper
from backend.memory.matcher import store_job_vector, match_jobs_to_resume
from backend.utils.date_filter import get_cutoff_date

router = APIRouter(prefix="/jobs", tags=["jobs"])

ALL_SCRAPERS = [
    IntershalaScraper,
    UnstopScraper,
    JSearchScraper,
]


def _scrape_and_store(domain: str, location: str, db: Session) -> int:
    """Run all scrapers and store new jobs. Returns count of new jobs added."""
    new_count = 0
    for ScraperClass in ALL_SCRAPERS:
        scraper = ScraperClass()
        try:
            listings = scraper.scrape(domain, location)
            logger.info(f"[Jobs] {ScraperClass.__name__}: {len(listings)} listings")
        except Exception as e:
            logger.error(f"[Jobs] {ScraperClass.__name__} failed: {e}")
            continue

        for listing in listings:
            dedup_key = hashlib.md5(
                f"{listing.company.lower().strip()}{listing.title.lower().strip()}".encode()
            ).hexdigest()

            if db.query(Job).filter(Job.embedding_id == dedup_key).first():
                continue

            job = Job(
                title=listing.title,
                company=listing.company,
                description=listing.description,
                platform=listing.platform,
                location=listing.location,
                stipend_salary=listing.stipend_salary,
                apply_link=listing.apply_link,
                posted_date=listing.posted_date,
                embedding_id=dedup_key,
            )
            db.add(job)
            db.flush()

            try:
                store_job_vector(
                    dedup_key,
                    listing.description,
                    job.id,
                    listing.platform,
                    str(listing.posted_date),
                )
            except Exception as ve:
                logger.error(f"[Jobs] Vector store failed: {ve}")

            new_count += 1

    db.commit()
    return new_count


@router.get("/feed")
def get_job_feed(
    user_id: int = Query(...),
    domain: str = Query(default=""),
    location: str = Query(default=""),
    db: Session = Depends(get_db),
):
    """
    Return fresh jobs for the user.
    Scrapes automatically if DB has < 10 fresh jobs.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    search_domain = domain or user.domain or "data analyst"
    search_location = location or user.location or ""
    cutoff = get_cutoff_date()

    existing_count = (
        db.query(Job)
        .filter(Job.posted_date >= cutoff, Job.is_expired == 0)
        .count()
    )

    if existing_count < 10:
        logger.info(f"[Jobs/feed] Only {existing_count} fresh jobs — triggering scrape")
        try:
            added = _scrape_and_store(search_domain, search_location, db)
            logger.info(f"[Jobs/feed] Scrape added {added} new jobs")
        except Exception as e:
            logger.error(f"[Jobs/feed] Scrape error: {e}")

    jobs = (
        db.query(Job)
        .filter(Job.posted_date >= cutoff, Job.is_expired == 0)
        .order_by(Job.scraped_at.desc())
        .limit(50)
        .all()
    )

    return [
        {
            "id": j.id,
            "title": j.title,
            "company": j.company,
            "platform": j.platform,
            "location": j.location,
            "stipend_salary": j.stipend_salary,
            "apply_link": j.apply_link,
            "posted_date": str(j.posted_date),
            "description": j.description[:300],
            "scraped_at": str(j.scraped_at) if j.scraped_at else "",
        }
        for j in jobs
    ]


@router.post("/scrape")
def manual_scrape(
    user_id: int = Query(...),
    force: bool = Query(default=True),
    db: Session = Depends(get_db),
):
    """
    Force-trigger a fresh scrape NOW regardless of what's in DB.
    Called when user clicks 'Fetch Fresh Jobs'.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    domain = user.domain or "data analyst"
    location = user.location or ""

    logger.info(f"[Jobs/scrape] Manual scrape triggered by user {user_id} — domain: {domain}, location: {location}")
    try:
        count = _scrape_and_store(domain, location, db)
        cutoff = get_cutoff_date()
        total_fresh = (
            db.query(Job)
            .filter(Job.posted_date >= cutoff, Job.is_expired == 0)
            .count()
        )
        return {
            "message": f"Scrape complete. {count} new jobs added.",
            "new_jobs": count,
            "total_fresh_in_db": total_fresh,
            "scraped_at": datetime.utcnow().isoformat(),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scrape failed: {str(e)}")


@router.get("/matches")
def get_matches(user_id: int = Query(...), db: Session = Depends(get_db)):
    """Return AI-matched jobs ranked by resume similarity."""
    resume = db.query(Resume).filter(
        Resume.user_id == user_id, Resume.is_active == 1
    ).first()

    if not resume or not resume.embedding_id:
        return get_job_feed(user_id=user_id, db=db)

    try:
        raw_matches = match_jobs_to_resume(resume.embedding_id, top_k=20)
    except Exception as e:
        logger.error(f"[Jobs/matches] Vector match failed: {e}")
        return get_job_feed(user_id=user_id, db=db)

    results = []
    for m in raw_matches:
        job = db.query(Job).filter(Job.id == m["job_id"]).first()
        if not job:
            continue
        results.append({
            "id": job.id,
            "title": job.title,
            "company": job.company,
            "platform": job.platform,
            "location": job.location,
            "stipend_salary": job.stipend_salary,
            "apply_link": job.apply_link,
            "posted_date": str(job.posted_date),
            "match_score": round(m["score"] * 100),
            "description": job.description[:300],
        })

    return results


@router.get("/top3")
def get_top3_jobs(user_id: int = Query(...), db: Session = Depends(get_db)):
    """Dashboard widget — 3 most recently scraped fresh jobs."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    cutoff = get_cutoff_date()
    jobs = (
        db.query(Job)
        .filter(Job.posted_date >= cutoff, Job.is_expired == 0)
        .order_by(Job.scraped_at.desc())
        .limit(3)
        .all()
    )

    if len(jobs) < 3:
        try:
            _scrape_and_store(user.domain or "data analyst", user.location or "", db)
            jobs = (
                db.query(Job)
                .filter(Job.posted_date >= cutoff, Job.is_expired == 0)
                .order_by(Job.scraped_at.desc())
                .limit(3)
                .all()
            )
        except Exception:
            pass

    return [
        {
            "id": j.id,
            "title": j.title,
            "company": j.company,
            "platform": j.platform,
            "location": j.location,
            "stipend_salary": j.stipend_salary,
            "apply_link": j.apply_link,
            "posted_date": str(j.posted_date),
        }
        for j in jobs
    ]


@router.get("/status")
def scrape_status(db: Session = Depends(get_db)):
    """Debug endpoint — how many jobs, how fresh, last scraped when."""
    cutoff = get_cutoff_date()
    total = db.query(Job).count()
    fresh = db.query(Job).filter(Job.posted_date >= cutoff, Job.is_expired == 0).count()
    by_platform = {}
    for platform in ["internshala", "unstop", "jsearch", "adzuna"]:
        by_platform[platform] = db.query(Job).filter(Job.platform == platform).count()
    latest = db.query(Job).order_by(Job.scraped_at.desc()).first()
    return {
        "total_jobs": total,
        "fresh_jobs_last_7_days": fresh,
        "cutoff_date": str(cutoff),
        "by_platform": by_platform,
        "last_scraped_at": str(latest.scraped_at) if latest and latest.scraped_at else "never",
    }