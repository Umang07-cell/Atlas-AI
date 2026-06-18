from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import date
from typing import List
from backend.utils.date_filter import is_fresh


@dataclass
class JobListing:
    title: str
    company: str
    description: str
    platform: str
    location: str
    stipend_salary: str
    apply_link: str
    posted_date: date


class BaseScraper(ABC):
    HEADERS = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/124.0.0.0 Safari/537.36"
        )
    }

    @abstractmethod
    def scrape(self, domain: str, location: str) -> List[JobListing]:
        pass

    def filter_fresh(self, listings: List[JobListing]) -> List[JobListing]:
        return [j for j in listings if is_fresh(j.posted_date)]
