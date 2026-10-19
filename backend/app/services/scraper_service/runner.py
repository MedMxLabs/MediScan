"""Run every pharmacy scraper concurrently under one deadline."""
from __future__ import annotations

import asyncio
import os
import random
from dataclasses import dataclass
from typing import Any
from urllib.parse import urlparse

from playwright.async_api import BrowserContext, async_playwright
from playwright_stealth import Stealth

from .browser_sites import scrape_1mg_pw, scrape_apollo_pw
from .common import MAX_CONCURRENT, PROXY_URL, TOTAL_SCRAPE_TIMEOUT, USER_AGENTS, logger
from .http_sites import scrape_medplus_httpx, scrape_netmeds_httpx, scrape_pharmeasy_httpx, scrape_truemeds_httpx

_STEALTH = Stealth(navigator_languages_override=("en-IN", "en"))

HTTPX_SCRAPERS: list[tuple[str, Any]] = [
    ("PharmEasy", scrape_pharmeasy_httpx),
    ("Netmeds", scrape_netmeds_httpx),
    ("TrueMeds", scrape_truemeds_httpx),
    ("MedPlus", scrape_medplus_httpx),
]

PW_SCRAPERS: list[tuple[str, Any]] = [
    ("Tata 1mg", scrape_1mg_pw),
    ("Apollo Pharmacy", scrape_apollo_pw),
]


@dataclass
class ScrapeOutcome:
    prices: list[dict[str, Any]]
    errors: list[dict[str, str]]


async def _run_httpx_scrapers(query: str, prices: list, errors: list) -> None:
    async def run(label: str, fn):
        try:
            prices.append(await fn(query))
        except Exception as exc:
            logger.warning("%s: %s", label, exc)
            errors.append({"pharmacy": label, "error": str(exc)})

    await asyncio.gather(*(run(label, fn) for label, fn in HTTPX_SCRAPERS))


_PW_READY: bool | None = None
_PW_SKIP_MSG = "Playwright Chromium not installed. Run: python -m playwright install chromium"


def _playwright_chromium_ready() -> bool:
    """Return True when Playwright's Chromium binary is present on disk.

    Uses the sync API, so it must not run on a thread with an active event loop.
    """
    global _PW_READY
    if _PW_READY is not None:
        return _PW_READY
    if os.environ.get("SKIP_PLAYWRIGHT", "").lower() in ("1", "true", "yes"):
        _PW_READY = False
        return False
    try:
        from playwright.sync_api import sync_playwright

        with sync_playwright() as pw:
            exe = pw.chromium.executable_path
            _PW_READY = bool(exe and os.path.isfile(exe))
    except Exception as exc:
        logger.warning("Playwright availability check failed: %s", exc)
        _PW_READY = False
    return bool(_PW_READY)


def _normalize_playwright_error(exc: BaseException) -> str:
    msg = str(exc)
    if "Executable doesn't exist" in msg or "playwright install" in msg.lower():
        return _PW_SKIP_MSG
    return msg


def _proxy_config() -> dict[str, str] | None:
    if not PROXY_URL:
        return None
    parsed = urlparse(PROXY_URL)
    cfg = {"server": f"{parsed.scheme}://{parsed.hostname}:{parsed.port}"}
    if parsed.username:
        cfg["username"] = parsed.username
    if parsed.password:
        cfg["password"] = parsed.password
    return cfg


async def _run_playwright_scrapers(
    normalized_query: str,
    prices_out: list[dict[str, Any]],
    errors: list[dict[str, str]],
    *,
    headless: bool,
) -> None:
    if not await asyncio.to_thread(_playwright_chromium_ready):
        for label, _ in PW_SCRAPERS:
            errors.append({"pharmacy": label, "error": _PW_SKIP_MSG})
        return

    sem = asyncio.Semaphore(MAX_CONCURRENT)

    async def run_pw(label: str, fn, context: BrowserContext) -> None:
        async with sem:
            await asyncio.sleep(random.uniform(0.2, 0.8))
            page = await context.new_page()
            page.set_default_timeout(60000)
            try:
                prices_out.append(await fn(page, normalized_query))
            except asyncio.CancelledError:
                raise
            except Exception as exc:
                logger.warning("%s: %s", label, exc)
                errors.append({"pharmacy": label, "error": _normalize_playwright_error(exc)})
            finally:
                try:
                    await page.close()
                except Exception:
                    pass

    try:
        async with _STEALTH.use_async(async_playwright()) as pw:
            browser = await pw.chromium.launch(
                headless=headless,
                args=[
                    "--disable-blink-features=AutomationControlled",
                    "--no-sandbox",
                    "--disable-dev-shm-usage",
                    "--disable-gpu",
                ],
                proxy=_proxy_config(),
            )
            context = await browser.new_context(
                user_agent=random.choice(USER_AGENTS),
                locale="en-IN",
                viewport={"width": 1366, "height": 896},
                extra_http_headers={
                    "Accept-Language": "en-IN,en;q=0.9",
                    "sec-ch-ua": '"Chromium";v="147", "Google Chrome";v="147", "Not=A?Brand";v="24"',
                    "sec-ch-ua-mobile": "?0",
                    "sec-ch-ua-platform": '"Windows"',
                },
            )
            try:
                label_for_task = {asyncio.create_task(run_pw(label, fn, context)): label for label, fn in PW_SCRAPERS}
                done, pending = await asyncio.wait(label_for_task.keys(), timeout=TOTAL_SCRAPE_TIMEOUT)
                for t in pending:
                    t.cancel()
                    errors.append({"pharmacy": label_for_task[t], "error": f"Timed out ({TOTAL_SCRAPE_TIMEOUT}s)"})
                if pending:
                    logger.info("PW timeout: %d done, %d cancelled", len(done), len(pending))
                    await asyncio.gather(*pending, return_exceptions=True)
            finally:
                await context.close()
                await browser.close()
    except Exception as exc:
        err = _normalize_playwright_error(exc)
        logger.warning("Playwright scrapers skipped: %s", err)
        for label, _ in PW_SCRAPERS:
            errors.append({"pharmacy": label, "error": err})


async def scrape_all_live_async(normalized_query: str, headless: bool = True) -> ScrapeOutcome:
    prices_out: list[dict[str, Any]] = []
    errors: list[dict[str, str]] = []
    await asyncio.gather(
        _run_httpx_scrapers(normalized_query, prices_out, errors),
        _run_playwright_scrapers(normalized_query, prices_out, errors, headless=headless),
    )
    prices_out.sort(key=lambda r: r.get("price", 0))
    return ScrapeOutcome(prices=prices_out, errors=errors)


def run_live_scrape(normalized_query: str, *, headless: bool | None = None) -> ScrapeOutcome:
    gh = True if headless is None else bool(headless)
    if os.environ.get("PLAYWRIGHT_HEADED", "").lower() in ("1", "true", "yes"):
        gh = False
    try:
        return asyncio.run(scrape_all_live_async(normalized_query, headless=gh))
    except Exception as exc:
        logger.exception("run_live_scrape failed for %r", normalized_query)
        return ScrapeOutcome(
            prices=[],
            errors=[{"pharmacy": "scraper", "error": _normalize_playwright_error(exc)}],
        )
