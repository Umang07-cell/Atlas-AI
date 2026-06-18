from datetime import datetime, date, timedelta
import re


FRESHNESS_DAYS = 7   # extended from 3 → 7 days


def is_fresh(posted_date: date) -> bool:
    """Return True if posted_date is within the last FRESHNESS_DAYS days."""
    cutoff = date.today() - timedelta(days=FRESHNESS_DAYS)
    return posted_date >= cutoff


def parse_relative_date(text: str) -> date:
    """
    Convert relative strings like '2 days ago', 'today', 'yesterday',
    '1 week ago' into an absolute date.
    Falls back to today if unparseable.
    """
    text = text.lower().strip()

    if not text or "today" in text or "just now" in text or "hour" in text or "minute" in text:
        return date.today()

    if "yesterday" in text:
        return date.today() - timedelta(days=1)

    days_match = re.search(r"(\d+)\s*day", text)
    if days_match:
        return date.today() - timedelta(days=int(days_match.group(1)))

    weeks_match = re.search(r"(\d+)\s*week", text)
    if weeks_match:
        return date.today() - timedelta(weeks=int(weeks_match.group(1)))

    months_match = re.search(r"(\d+)\s*month", text)
    if months_match:
        return date.today() - timedelta(days=int(months_match.group(1)) * 30)

    # Try direct date formats
    for fmt in ("%d %b %Y", "%b %d, %Y", "%Y-%m-%d", "%d/%m/%Y", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%dT%H:%M:%SZ"):
        try:
            return datetime.strptime(text[:len(fmt)+2], fmt).date()
        except ValueError:
            continue

    return date.today()


def get_cutoff_date() -> date:
    return date.today() - timedelta(days=FRESHNESS_DAYS)
