"""Config and parsing helpers shared by every pharmacy scraper."""
from __future__ import annotations

import json
import logging
import os
import random
import re
from datetime import datetime
from typing import Any

logger = logging.getLogger("app.services.scraper_service")

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36",
]

MAX_CONCURRENT = int(os.environ.get("SCRAPER_CONCURRENCY", "6"))
TOTAL_SCRAPE_TIMEOUT = int(os.environ.get("SCRAPER_TIMEOUT_SECS", "120"))
PROXY_URL = os.environ.get("SCRAPER_PROXY_URL", "").strip()

_NEXT_DATA_RE = re.compile(r'<script[^>]*id="__NEXT_DATA__"[^>]*>(.*?)</script>', re.S)
_LD_JSON_RE = re.compile(r'<script[^>]*type="application/ld\+json"[^>]*>(.*?)</script>', re.S)
_TITLE_RE = re.compile(r"<title>(.*?)</title>", re.I)


def _unit_price_from_pack(price: float, pack: str) -> float | None:
    """Derive per-tablet/capsule price when pack size mentions a count."""
    if not pack or not price:
        return None
    m = re.search(
        r"(\d+)\s*(?:tablets?|tabs?|capsules?|caps?|strips?|units?)\b",
        pack,
        re.I,
    )
    if not m:
        m = re.search(r"(?:pack\s*of|contains?)\s*(\d+)", pack, re.I)
    if m:
        count = int(m.group(1))
        if count > 0:
            return round(price / count, 2)
    return None


def make_result(pharmacy: str, name: str, price: float, url: str, pack: str = "") -> dict[str, Any]:
    return {
        "pharmacy_name": pharmacy,
        "medicine_display": name,
        "pack_size": pack,
        "price": price,
        "unit_price": _unit_price_from_pack(price, pack),
        "discount": "",
        "availability": "See pharmacy site",
        "url": url[:1024],
        "scraped_at": datetime.utcnow().isoformat() + "Z",
    }


def label_matches_query(label: str, query: str) -> bool:
    label_clean = re.sub(r"[^\w\s]", " ", label.lower()).strip()
    label_words = label_clean.split()
    q_words = [w for w in query.lower().strip().split() if len(w) >= 2]
    if not q_words:
        return label_clean.startswith(query.lower().strip())
    for w in q_words:
        for idx, lw in enumerate(label_words):
            if lw.startswith(w) or w.startswith(lw):
                return idx <= 6
    return False


def parse_inr(blob: str) -> float | None:
    blob = (blob or "").replace("\xa0", " ")
    for pat in (
        r"₹\s*([1-9][0-9,]*(?:\.\d{1,2})?)",
        r"(?:Rs\.?|MRP|INR)\s*:?\s*₹?\s*([1-9][0-9,]*(?:\.\d{1,2})?)",
    ):
        m = re.search(pat, blob, re.I)
        if m:
            try:
                p = float(m.group(1).replace(",", ""))
                if 3 <= p <= 800_000:
                    return p
            except (ValueError, IndexError):
                continue
    return None


def httpx_headers() -> dict[str, str]:
    return {
        "User-Agent": random.choice(USER_AGENTS),
        "Accept": "text/html,application/json",
        "Accept-Language": "en-IN,en;q=0.9",
    }


def next_data(html: str) -> dict | None:
    m = _NEXT_DATA_RE.search(html)
    return json.loads(m.group(1)) if m else None


def product_from_page(html: str, pharmacy: str, product_url: str) -> dict[str, Any] | None:
    """Price from schema.org Product JSON-LD, else <title> + first ₹ amount."""
    for ld_str in _LD_JSON_RE.findall(html):
        try:
            ld = json.loads(ld_str)
        except json.JSONDecodeError:
            continue
        for item in ld if isinstance(ld, list) else [ld]:
            if not isinstance(item, dict) or item.get("@type") != "Product" or not item.get("name"):
                continue
            offers = item.get("offers") or {}
            if isinstance(offers, list):
                offers = offers[0] if offers and isinstance(offers[0], dict) else {}
            try:
                price = float(offers.get("price") or offers.get("lowPrice") or 0)
            except (TypeError, ValueError):
                continue
            if price > 0:
                logger.info("%s JSON-LD: %s ₹%.2f", pharmacy, item["name"], price)
                return make_result(pharmacy, item["name"], price, offers.get("url") or product_url)

    title_m = _TITLE_RE.search(html)
    title = (title_m.group(1) if title_m else "").split("|")[0].split("-")[0].strip()
    price = parse_inr(html[:15000])
    if title and price:
        logger.info("%s HTML fallback: %s ₹%.2f", pharmacy, title, price)
        return make_result(pharmacy, title, price, product_url)
    return None
