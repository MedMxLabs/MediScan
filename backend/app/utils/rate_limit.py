"""Simple in-memory rate limiting for expensive routes."""
from __future__ import annotations

import os
import time
from collections import defaultdict
from threading import Lock

_lock = Lock()
_buckets: dict[str, list[float]] = defaultdict(list)

DEFAULT_LIMIT = int(os.environ.get("MEDSCAN_RATE_LIMIT_PER_MIN", "30"))
SCRAPE_LIMIT = int(os.environ.get("MEDSCAN_SCRAPE_RATE_LIMIT_PER_MIN", "8"))


def _client_key() -> str:
    from flask import request

    return request.remote_addr or "unknown"


def _allow(key: str, limit: int, window_sec: int = 60) -> bool:
    now = time.time()
    with _lock:
        hits = [t for t in _buckets[key] if now - t < window_sec]
        if len(hits) >= limit:
            _buckets[key] = hits
            return False
        hits.append(now)
        _buckets[key] = hits
        return True


def check_api_limit() -> tuple[bool, str | None]:
    if os.environ.get("MEDSCAN_DISABLE_RATE_LIMIT", "").lower() in ("1", "true", "yes"):
        return True, None
    if not _allow(f"api:{_client_key()}", DEFAULT_LIMIT):
        return False, "Too many requests — try again in a minute."
    return True, None


def check_scrape_limit() -> tuple[bool, str | None]:
    if os.environ.get("MEDSCAN_DISABLE_RATE_LIMIT", "").lower() in ("1", "true", "yes"):
        return True, None
    if not _allow(f"scrape:{_client_key()}", SCRAPE_LIMIT):
        return False, "Search rate limit reached — wait a minute before another live scrape."
    return True, None
