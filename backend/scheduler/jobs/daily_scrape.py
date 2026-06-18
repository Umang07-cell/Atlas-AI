import hashlib
from datetime import datetime
from venv import logger
from backend.database import SessionLocal
from backend.models.job import Job
from backend.memory.matcher import store_job_vector
from backend.scrapers.internshala import IntershalaScraper
from backend.scrapers.unstop import UnstopScraper
from backend.scrapers.jsearch_scraper import JSearchScraper
from backend.models.user import User


def run_daily_scrape():
    logger.info(f"[Scraper] Starting scrape at {datetime.utcnow()}")
    db = SessionLocal()

    scrapers = [
        IntershalaScraper(),
        UnstopScraper(),
        JSearchScraper(),
    ]

    try:
        users = db.query(User).filter(User.schedule_active == 1).all()
        targets = list({(u.domain, u.location) for u in users if u.domain})
        if not targets:
            targets = [("data analyst", "India"), ("software engineer", "India")]

        new_count = 0
        for domain, location in targets:
            logger.info(f"[Scraper] Domain: {domain} | Location: {location}")
            for scraper in scrapers:
                try:
                    listings = scraper.scrape(domain, location)
                    logger.info(f"[Scraper] {scraper.__class__.__name__}: {len(listings)} fresh listings")
                except Exception as e:
                    logger.error(f"[Scraper] {scraper.__class__.__name__} failed: {e}")
                    continue

                for listing in listings:
                    dedup_key = hashlib.md5(
                        f"{listing.company.lower().strip()}{listing.title.lower().strip()}".encode()
                    ).hexdigest()

                    existing = db.query(Job).filter(Job.embedding_id == dedup_key).first()
                    if existing:
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
                            str(listing.posted_date)
                        )
                    except Exception as e:
                        logger.error(f"[Scraper] Vector store failed: {e}")

                    new_count += 1

        db.commit()
        logger.info(f"[Scraper] ✅ Done. {new_count} new jobs added.")

    except Exception as e:
        logger.error(f"[Scraper] Fatal error: {e}")
        db.rollback()
    finally:
        db.close()