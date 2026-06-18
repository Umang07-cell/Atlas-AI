import logging
logger = logging.getLogger(__name__)

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from apscheduler.triggers.cron import CronTrigger

scheduler = AsyncIOScheduler()


def start_scheduler():
    from backend.scheduler.jobs.daily_scrape import run_daily_scrape
    from backend.scheduler.jobs.daily_match import run_daily_match

    # ── Job scraping every 6 hours ──────────────────────────────────────────
    # Runs at 6am, 12pm, 6pm, 12am so users always see fresh listings
    scheduler.add_job(
        run_daily_scrape,
        IntervalTrigger(hours=6),
        id="scrape_every_6h",
        replace_existing=True,
        max_instances=1,          # Never run two scrapes at once
        misfire_grace_time=300,   # 5-min grace if server was busy
    )

    # ── Match jobs to resumes — runs 30 min after each scrape ───────────────
    scheduler.add_job(
        run_daily_match,
        CronTrigger(hour="6,12,18,0", minute=30),
        id="match_every_6h",
        replace_existing=True,
        max_instances=1,
    )


    scheduler.start()
    logger.info("[Scheduler] ✅ All jobs registered. Scraping every 6 hours.")


def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("[Scheduler] Stopped.")
