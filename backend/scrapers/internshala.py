import logging
logger = logging.getLogger(__name__)

"""
Internshala scraper — robust multi-selector approach.

Internshala uses React-rendered HTML. The page structure has changed
multiple times. This version tries multiple selector strategies and
also fetches individual listing pages for rich descriptions.
"""
import re
import requests
import time
import random
from bs4 import BeautifulSoup
from typing import List
from backend.scrapers.base_scraper import BaseScraper, JobListing
from backend.utils.date_filter import parse_relative_date


class IntershalaScraper(BaseScraper):

    SEARCH_URLS = [
        "https://internshala.com/internships/{domain}-internship/",
        "https://internshala.com/jobs/keywords-{domain}/",
        "https://internshala.com/internships/keywords-{domain}/",
    ]

    HEADERS_LIST = [
        {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language": "en-IN,en;q=0.9,hi;q=0.8",
            "Accept-Encoding": "gzip, deflate, br",
            "Cache-Control": "no-cache",
            "Pragma": "no-cache",
            "Sec-Fetch-Dest": "document",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-Site": "none",
            "Upgrade-Insecure-Requests": "1",
        },
        {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
            "Accept-Encoding": "gzip, deflate, br",
        },
        {
            "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-GB,en;q=0.9",
        },
    ]

    def _get(self, url: str) -> requests.Response | None:
        for attempt in range(3):
            try:
                headers = random.choice(self.HEADERS_LIST)
                time.sleep(random.uniform(1.5, 3.5))
                resp = requests.get(url, headers=headers, timeout=25)
                if resp.status_code == 200:
                    return resp
                if resp.status_code in (429, 503):
                    time.sleep(5 * (attempt + 1))
            except Exception as e:
                logger.error(f"[Internshala] GET failed ({attempt+1}/3): {e}")
        return None

    def _extract_description(self, card: BeautifulSoup, title: str, company: str, url: str) -> str:
        """Try to get a rich description. Fallback to constructing one."""
        # Look for about/details section in the card itself
        about = (
            card.find("div", class_=lambda c: c and "about" in c.lower() if c else False) or
            card.find("p", class_=lambda c: c and "detail" in c.lower() if c else False) or
            card.find("div", class_=lambda c: c and "description" in c.lower() if c else False)
        )
        if about:
            text = about.get_text(separator=" ", strip=True)
            if len(text) > 50:
                return text[:2000]

        # Fallback: construct a rich description from all card text
        all_text = card.get_text(separator=" ", strip=True)
        # Remove duplicated whitespace
        all_text = re.sub(r'\s+', ' ', all_text).strip()
        if len(all_text) > 100:
            return f"{title} at {company}. {all_text[:1500]}"

        return f"{title} at {company}. Apply on Internshala: {url}"

    def scrape(self, domain: str, location: str = "") -> List[JobListing]:
        domain_slug = domain.lower().replace(" ", "-").replace("/", "-")
        listings = []
        seen_keys = set()

        for url_template in self.SEARCH_URLS:
            url = url_template.format(domain=domain_slug)
            if location:
                loc_slug = location.lower().replace(" ", "-")
                url += f"?location={loc_slug}"

            resp = self._get(url)
            if not resp:
                logger.error(f"[Internshala] Failed to fetch {url}")
                continue

            soup = BeautifulSoup(resp.text, "lxml")

            # Multiple card selector strategies — Internshala changes classes often
            cards = (
                soup.find_all("div", class_="individual_internship") or
                soup.find_all("div", class_=lambda c: c and "individual_internship" in (c if isinstance(c, str) else " ".join(c)) if c else False) or
                soup.find_all("div", attrs={"data-internship_id": True}) or
                soup.find_all("div", attrs={"data-job-id": True}) or
                soup.find_all("li", class_=lambda c: c and "internship" in c.lower() if c else False) or
                soup.find_all("div", class_=lambda c: c and "job_listing" in c.lower() if c else False)
            )

            logger.info(f"[Internshala] {url} → {len(cards)} cards")

            for card in cards[:20]:
                try:
                    # Title — multiple strategies
                    title_el = (
                        card.find("h3", class_="job-internship-name") or
                        card.find("h3", class_=lambda c: c and "title" in c.lower() if c else False) or
                        card.find("a", class_=lambda c: c and "job-title" in c.lower() if c else False) or
                        card.find("h3") or
                        card.find("h2")
                    )

                    # Company
                    company_el = (
                        card.find("p", class_="company-name") or
                        card.find("a", class_=lambda c: c and "company" in c.lower() if c else False) or
                        card.find("p", class_=lambda c: c and "company" in c.lower() if c else False) or
                        card.find("div", class_=lambda c: c and "company" in c.lower() if c else False)
                    )

                    # Location
                    location_el = (
                        card.find("p", class_="locations") or
                        card.find("a", class_=lambda c: c and "location" in c.lower() if c else False) or
                        card.find("div", class_="location_link") or
                        card.find("span", class_=lambda c: c and "location" in c.lower() if c else False)
                    )

                    # Stipend/Salary
                    stipend_el = (
                        card.find("span", class_="stipend") or
                        card.find("span", class_=lambda c: c and "stipend" in c.lower() if c else False) or
                        card.find("div", class_=lambda c: c and "salary" in c.lower() if c else False)
                    )

                    # Link
                    link_el = (
                        card.find("a", href=lambda h: h and ("/internship/detail/" in h or "/job/detail/" in h) if h else False) or
                        card.find("a", href=lambda h: h and ("/internship/" in h or "/job/" in h) if h else False) or
                        card.find("a", href=True)
                    )

                    # Posted date
                    posted_el = (
                        card.find("div", class_=lambda c: c and "status" in c.lower() if c else False) or
                        card.find("span", class_=lambda c: c and "posted" in c.lower() if c else False) or
                        card.find("p", class_=lambda c: c and "date" in c.lower() if c else False)
                    )

                    title = title_el.get_text(strip=True) if title_el else None
                    if not title or len(title) < 3:
                        continue

                    # Clean title — sometimes gets extra text
                    title = re.sub(r'\s+', ' ', title).strip()[:100]

                    company = company_el.get_text(strip=True) if company_el else "Company on Internshala"
                    company = re.sub(r'\s+', ' ', company).strip()[:100]

                    loc = location_el.get_text(strip=True) if location_el else (location or "India")
                    loc = re.sub(r'\s+', ' ', loc).strip()[:100]

                    stipend = stipend_el.get_text(strip=True) if stipend_el else "As per industry norms"
                    stipend = re.sub(r'\s+', ' ', stipend).strip()[:100]

                    posted_text = posted_el.get_text(strip=True) if posted_el else "today"
                    posted_date = parse_relative_date(posted_text)

                    href = link_el["href"] if link_el and link_el.get("href") else ""
                    apply_link = ("https://internshala.com" + href) if href.startswith("/") else (href or url)

                    # Dedup within this scrape run
                    key = f"{company.lower()}|{title.lower()}"
                    if key in seen_keys:
                        continue
                    seen_keys.add(key)

                    description = self._extract_description(card, title, company, apply_link)

                    listings.append(JobListing(
                        title=title,
                        company=company,
                        description=description,
                        platform="internshala",
                        location=loc,
                        stipend_salary=stipend,
                        apply_link=apply_link,
                        posted_date=posted_date,
                    ))

                except Exception as e:
                    logger.error(f"[Internshala] Error occurred while processing a job listing: {e}")
                    continue

        logger.info(f"[Internshala] Total raw listings: {len(listings)}")
        fresh = self.filter_fresh(listings)
        logger.info(f"[Internshala] Fresh listings: {len(fresh)}")
        return fresh
