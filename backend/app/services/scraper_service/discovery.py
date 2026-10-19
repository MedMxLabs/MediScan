"""Product-URL discovery for sites without a usable search API (TrueMeds, MedPlus)."""
from __future__ import annotations

import asyncio
import json
import os
import random
import re
from urllib.parse import parse_qs, quote_plus, unquote, urlparse

import httpx

from .common import httpx_headers, logger

_SEED_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "data", "product_url_cache.json")
_URL_CACHE_MAX = 2000


def _load_seed_cache() -> dict[str, str]:
    """Load prebuilt product URL cache from disk."""
    try:
        with open(_SEED_PATH) as f:
            data = json.load(f)
        logger.info("Loaded %d seed product URLs from cache", len(data))
        return data
    except Exception:
        return {}


_URL_CACHE: dict[str, str] = _load_seed_cache()


def _extract_real_url(url: str) -> str:
    """Strip Google redirect wrappers to get the actual destination URL."""
    if "google.com/url" in url:
        return parse_qs(urlparse(url).query).get("q", [url])[0]
    return url


async def find_product_url(query: str, site_domain: str, path_hints: tuple[str, ...] = ()) -> str | None:
    """Find a product URL on site_domain matching query.

    Strategy chain:
      0. In-memory / seed cache (instant, no network)
      1. Google "I'm Feeling Lucky" redirect (fastest live lookup)
      2. DuckDuckGo HTML search
      3. DuckDuckGo Lite search
    Results are cached in-memory to avoid repeated calls.
    """
    cache_key = f"{query.lower().strip()}|{site_domain}"
    if cache_key in _URL_CACHE:
        return _URL_CACHE[cache_key]

    def _cache_and_return(url: str) -> str:
        url = _extract_real_url(url)
        if len(_URL_CACHE) >= _URL_CACHE_MAX:
            _URL_CACHE.pop(next(iter(_URL_CACHE)), None)
        _URL_CACHE[cache_key] = url
        return url

    q_encoded = quote_plus(query + " tablet site:" + site_domain)

    try:
        async with httpx.AsyncClient(headers=httpx_headers(), follow_redirects=True, timeout=12) as c:
            r = await c.get(f"https://www.google.com/search?q={q_encoded}&btnI=1")
        final_url = _extract_real_url(str(r.url))
        if site_domain in final_url and "google.com" not in final_url:
            logger.info("Google Lucky → %s", final_url[:80])
            return _cache_and_return(final_url)
    except Exception as exc:
        logger.debug("Google Lucky failed for %s: %s", site_domain, exc)

    for ddg_url in (
        f"https://html.duckduckgo.com/html/?q={q_encoded}",
        f"https://lite.duckduckgo.com/lite/?q={q_encoded}",
    ):
        try:
            await asyncio.sleep(random.uniform(0.3, 0.8))
            async with httpx.AsyncClient(
                headers={**httpx_headers(), "Referer": "https://duckduckgo.com/"},
                follow_redirects=True,
                timeout=15,
            ) as c:
                r = await c.get(ddg_url)
            if r.status_code != 200:
                continue
            candidates: list[str] = []
            for url in (unquote(u) for u in re.findall(r'uddg=(https?[^&"]+)', r.text)):
                if site_domain not in url:
                    continue
                if path_hints and any(h in url.lower() for h in path_hints):
                    candidates.insert(0, url)
                else:
                    candidates.append(url)
            if candidates:
                logger.info("DDG found %d candidates for %s", len(candidates), site_domain)
                return _cache_and_return(candidates[0])
        except Exception as exc:
            logger.debug("DDG failed for %s: %s", site_domain, exc)

    return None
