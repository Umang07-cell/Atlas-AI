import logging
logger = logging.getLogger(__name__)

"""
JSearch scraper — RapidAPI's JSearch endpoint.
Aggregates LinkedIn, Indeed, Glassdoor, and others in a single API call.
Docs: https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch
"""
import os
import requests
from datetime import date
from typing import List
from backend.scrapers.base_scraper import BaseScraper, JobListing
from backend.utils.date_filter import parse_relative_date


class JSearchScraper(BaseScraper):

    BASE_URL = "https://jsearch.p.rapidapi.com/search"
    PLATFORM = "jsearch"

    def __init__(self):
        self.api_key = os.getenv("JSEARCH_API_KEY", "")

    def scrape(self, domain: str, location: str) -> List[JobListing]:
        if not self.api_key:
            logger.info("[JSearch] JSEARCH_API_KEY not set — skipping")
            return []

        query = f"{domain} {location}".strip() if location else domain

        params = {
            "query": query,
            "page": "1",
            "num_pages": "2",          # 10 results per page → up to 20 jobs
            "date_posted": "week",     # only last 7 days
            "country": "in",           # bias toward India
        }

        headers = {
            "X-RapidAPI-Key": self.api_key,
            "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
        }

        try:
            resp = requests.get(self.BASE_URL, headers=headers, params=params, timeout=20)
            resp.raise_for_status()
            data = resp.json()
        except Exception as e:
            logger.error(f"[JSearch] Request failed: {e}")
            return []

        jobs_data = data.get("data", [])
        listings: List[JobListing] = []

        for job in jobs_data:
            try:
                # posted_date: JSearch returns epoch ms in job_posted_at_datetime_utc
                raw_date = job.get("job_posted_at_datetime_utc", "")
                if raw_date:
                    posted = parse_relative_date(raw_date[:10])   # trim to YYYY-MM-DD
                else:
                    posted = date.today()

                salary = ""
                min_s = job.get("job_min_salary")
                max_s = job.get("job_max_salary")
                currency = job.get("job_salary_currency", "")
                period = job.get("job_salary_period", "")
                if min_s and max_s:
                    salary = f"{currency} {int(min_s):,}–{int(max_s):,} / {period}"
                elif min_s:
                    salary = f"{currency} {int(min_s):,} / {period}"

                listings.append(JobListing(
                    title=job.get("job_title", "Unknown Title"),
                    company=job.get("employer_name", "Unknown Company"),
                    description=(job.get("job_description") or "")[:2000],
                    platform=self.PLATFORM,
                    location=job.get("job_city") or job.get("job_country") or location or "Remote",
                    stipend_salary=salary,
                    apply_link=job.get("job_apply_link") or job.get("job_google_link") or "",
                    posted_date=posted,
                ))
            except Exception as e:
                logger.error(f"[JSearch] Failed to parse job entry: {e}")
                continue

        fresh = self.filter_fresh(listings)
        logger.info(f"[JSearch] {len(fresh)} fresh listings for '{query}'")
        return fresh