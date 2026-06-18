import logging
logger = logging.getLogger(__name__)

"""
Unstop scraper — improved with richer descriptions and better parsing.
"""
import re
import json
import requests
import time
import random
from bs4 import BeautifulSoup
from typing import List
from datetime import date
from backend.scrapers.base_scraper import BaseScraper, JobListing
from backend.utils.date_filter import parse_relative_date


class UnstopScraper(BaseScraper):

    API_URL = "https://unstop.com/api/public/opportunity/search-result"
    BASE_URL = "https://unstop.com/jobs"

    HEADERS_API = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "en-IN,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Referer": "https://unstop.com/jobs",
        "Origin": "https://unstop.com",
        "x-requested-with": "XMLHttpRequest",
    }

    HEADERS_HTML = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-IN,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Referer": "https://unstop.com/",
    }

    def _build_description(self, item: dict, title: str, company: str, loc: str) -> str:
        """Build a rich description from all available API fields."""
        parts = [f"{title} at {company}."]

        if loc:
            parts.append(f"Location: {loc}.")

        # Skills / eligibility
        eligible = item.get("eligible_courses", [])
        if eligible and isinstance(eligible, list):
            skills_text = ", ".join(
                c.get("course", {}).get("name", "") for c in eligible[:5] if isinstance(c, dict)
            )
            if skills_text:
                parts.append(f"Eligible courses: {skills_text}.")

        # Salary
        min_sal = item.get("min_salary") or item.get("salary_min")
        max_sal = item.get("max_salary") or item.get("salary_max")
        if min_sal or max_sal:
            parts.append(f"Salary: ₹{min_sal or '?'} - ₹{max_sal or '?'} LPA.")

        # Duration for internships
        duration = item.get("duration")
        if duration:
            parts.append(f"Duration: {duration}.")

        # Description fields
        about = (
            item.get("about") or
            item.get("description") or
            item.get("additional_info") or
            item.get("job_description") or
            ""
        )
        if about and len(str(about)) > 20:
            clean = re.sub(r'<[^>]+>', ' ', str(about))
            clean = re.sub(r'\s+', ' ', clean).strip()
            parts.append(clean[:800])

        # Tags
        tags = item.get("tags", [])
        if tags and isinstance(tags, list):
            tag_names = [t.get("name", "") for t in tags[:8] if isinstance(t, dict)]
            if any(tag_names):
                parts.append(f"Skills: {', '.join(filter(None, tag_names))}.")

        # Stipend info
        stipend = item.get("stipend")
        if stipend and str(stipend) != "0":
            parts.append(f"Stipend: ₹{stipend}/month.")

        return " ".join(parts)[:2000]

    def _try_api(self, domain: str, location: str) -> List[JobListing]:
        """Use Unstop's public API."""
        listings = []
        try:
            time.sleep(random.uniform(1, 2.5))

            # Try both jobs and internships
            for opp_type in ["jobs", "internships"]:
                params = {
                    "opportunity": opp_type,
                    "searchTerm": domain,
                    "oppstatus": "open",
                    "per_page": 20,
                    "page": 1,
                }
                if location:
                    params["location"] = location

                resp = requests.get(
                    self.API_URL,
                    headers=self.HEADERS_API,
                    params=params,
                    timeout=20
                )

                if resp.status_code != 200:
                    logger.info(f"[Unstop API] {opp_type}: Status {resp.status_code}")
                    continue

                data = resp.json()

                # Navigate nested structure
                items = (
                    data.get("data", {}).get("data", []) or
                    data.get("data", []) or
                    data.get("results", []) or
                    []
                )

                logger.info(f"[Unstop API] {opp_type}: {len(items)} items")

                for item in items[:20]:
                    try:
                        title = (item.get("title") or item.get("job_title") or "").strip()
                        if not title:
                            continue

                        # Company / organisation
                        org = item.get("organisation") or item.get("company") or {}
                        if isinstance(org, dict):
                            company = org.get("name") or org.get("organisation_name") or "Company on Unstop"
                        else:
                            company = str(org) or "Company on Unstop"
                        company = company.strip()[:100]

                        # Location
                        loc = location or "India"
                        loc_data = item.get("location") or item.get("city") or ""
                        if isinstance(loc_data, list):
                            loc = ", ".join(str(l) for l in loc_data[:3])
                        elif loc_data:
                            loc = str(loc_data)

                        # Apply link
                        public_url = item.get("public_url") or item.get("url") or item.get("id", "")
                        if public_url and not str(public_url).startswith("http"):
                            apply_link = f"https://unstop.com/{public_url}"
                        else:
                            apply_link = str(public_url) if public_url else self.BASE_URL

                        # Salary/stipend
                        stipend_val = (
                            item.get("stipend") or
                            item.get("salary") or
                            item.get("ctc") or
                            item.get("min_salary") or ""
                        )
                        stipend = f"₹{stipend_val}" if stipend_val and str(stipend_val) != "0" else "As per norms"

                        # Date
                        posted_text = (
                            item.get("updated_at") or
                            item.get("published_at") or
                            item.get("created_at") or
                            item.get("start_date") or
                            "today"
                        )
                        posted_date = parse_relative_date(str(posted_text))

                        description = self._build_description(item, title, company, loc)

                        listings.append(JobListing(
                            title=title[:100],
                            company=company,
                            description=description,
                            platform="unstop",
                            location=loc[:100],
                            stipend_salary=stipend[:100],
                            apply_link=apply_link,
                            posted_date=posted_date,
                        ))
                    except Exception as e:
                        continue

        except Exception as e:
            logger.error(f"[Unstop API] Failed: {e}")

        return listings

    def _try_html(self, domain: str, location: str) -> List[JobListing]:
        """HTML fallback with JSON-LD extraction."""
        listings = []
        try:
            time.sleep(random.uniform(1.5, 3))
            params = {"searchTerm": domain, "oppstatus": "open"}
            resp = requests.get(
                self.BASE_URL,
                headers=self.HEADERS_HTML,
                params=params,
                timeout=20
            )

            if resp.status_code != 200:
                return []

            soup = BeautifulSoup(resp.text, "lxml")

            # Try JSON-LD
            for script in soup.find_all("script", type="application/ld+json"):
                try:
                    data = json.loads(script.string or "")
                    items = []
                    if isinstance(data, dict) and data.get("@type") == "ItemList":
                        items = data.get("itemListElement", [])
                    elif isinstance(data, list):
                        items = data

                    for item in items[:15]:
                        job = item.get("item", item)
                        title = job.get("title", job.get("name", ""))
                        if not title:
                            continue
                        company = job.get("hiringOrganization", {}).get("name", "Company on Unstop")
                        loc = job.get("jobLocation", {}).get("address", {}).get("addressLocality", location or "India")
                        apply_link = job.get("url", self.BASE_URL)
                        desc = job.get("description", f"{title} at {company}.")
                        clean_desc = re.sub(r'<[^>]+>', ' ', desc)
                        listings.append(JobListing(
                            title=title[:100], company=company[:100],
                            description=clean_desc[:2000], platform="unstop",
                            location=loc[:100], stipend_salary="",
                            apply_link=apply_link, posted_date=date.today(),
                        ))
                except Exception:
                    continue

        except Exception as e:
            logger.error(f"[Unstop HTML] Failed: {e}")

        logger.info(f"[Unstop HTML] Got {len(listings)} listings")
        return listings

    def scrape(self, domain: str, location: str = "") -> List[JobListing]:
        listings = self._try_api(domain, location)

        if not listings:
            logger.info("[Unstop] API returned nothing, trying HTML...")
            listings = self._try_html(domain, location)

        fresh = self.filter_fresh(listings)
        logger.info(f"[Unstop] Fresh: {len(fresh)}")
        return fresh
