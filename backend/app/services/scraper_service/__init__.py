"""
Hybrid pharmacy scraper — httpx for PharmEasy, Netmeds, TrueMeds, MedPlus;
Playwright only for 1mg & Apollo (which need full browser rendering).

TrueMeds/MedPlus discover the product URL via search engines, then httpx
fetches the server-rendered page for structured data.
"""
from .common import TOTAL_SCRAPE_TIMEOUT, _unit_price_from_pack
from .runner import HTTPX_SCRAPERS, PW_SCRAPERS, ScrapeOutcome, run_live_scrape, scrape_all_live_async

__all__ = [
    "HTTPX_SCRAPERS",
    "PW_SCRAPERS",
    "TOTAL_SCRAPE_TIMEOUT",
    "ScrapeOutcome",
    "_unit_price_from_pack",
    "run_live_scrape",
    "scrape_all_live_async",
]
