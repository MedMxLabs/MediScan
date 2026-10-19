"""Playwright scrapers for 1mg and Apollo, which need full browser rendering."""
from __future__ import annotations

import asyncio
import random
from typing import Any, Callable
from urllib.parse import quote_plus, urljoin, urlparse

from playwright.async_api import Page

from .common import label_matches_query, logger, make_result, parse_inr


async def _goto(page: Page, url: str) -> None:
    await page.goto(url, wait_until="domcontentloaded", timeout=75000)
    try:
        await page.wait_for_load_state("networkidle", timeout=20_000)
    except Exception:
        pass
    try:
        await page.evaluate("window.scrollTo(0, Math.min(600, document.body.scrollHeight * 0.25))")
        await asyncio.sleep(1.5)
        await page.evaluate("window.scrollTo(0, Math.min(1200, document.body.scrollHeight * 0.5))")
        await asyncio.sleep(0.5)
    except Exception:
        pass


async def _cookies(page: Page) -> None:
    for sel in ("#onetrust-accept-btn-handler", "button:has-text('Accept')", "button:has-text('AGREE')"):
        try:
            loc = page.locator(sel).first
            if await loc.is_visible(timeout=800):
                await loc.click(timeout=3000)
                return
        except Exception:
            continue


async def _text_search_fallback(page: Page, query: str) -> tuple[float, str, str] | None:
    try:
        cards = page.locator(
            '[class*="card"], [class*="Card"], [class*="product"], [class*="Product"], '
            '[class*="item"], [class*="Item"], [data-testid], article, li'
        )
        for i in range(min(await cards.count(), 60)):
            card = cards.nth(i)
            try:
                txt = (await card.inner_text(timeout=3000)).strip()
            except Exception:
                continue
            if not txt or len(txt) < 5:
                continue
            first_line = txt.split("\n")[0].strip()
            if not label_matches_query(first_line, query):
                continue
            px = parse_inr(txt)
            if not px:
                continue
            link = page.url
            try:
                href_raw = await card.locator("a[href]").first.get_attribute("href", timeout=2000)
                if href_raw:
                    link = urljoin(page.url, href_raw.split("#")[0])
            except Exception:
                pass
            return px, first_line[:220], link
    except Exception:
        pass
    return None


def _is_1mg(u: str) -> bool:
    try:
        p = urlparse(u)
        return "1mg.com" in p.netloc.lower() and bool(p.path.strip("/")) and not p.path.startswith("/search")
    except Exception:
        return False


def _is_ap(u: str) -> bool:
    try:
        p = urlparse(u)
        return "apollopharmacy.in" in p.netloc.lower() and bool(p.path.strip("/")) and "search-medicines" not in p.path.lower()
    except Exception:
        return False


async def _anchor_walk(page: Page, host_sub: str, href_ok: Callable[[str], bool], query: str) -> tuple[float, str, str]:
    base = page.url
    loc = page.locator("a[href]")
    for i in range(min(await loc.count(), 250)):
        a = loc.nth(i)
        raw = (await a.get_attribute("href") or "").split("#")[0].strip()
        if not raw or raw.startswith(("#", "javascript", "mailto:", "tel:")):
            continue
        abs_href = urljoin(base, raw)
        if not href_ok(abs_href):
            continue
        anchor_text = (await a.inner_text()).strip()
        label = anchor_text.split("\n")[0][:220]
        try:
            container_text = await a.evaluate(
                """el => {
                  const n = el.closest('article, li, [data-testid], [class*="card"], [class*="Card"], [class*="product"], section, div');
                  return n ? n.innerText : el.innerText;
                }"""
            )
        except Exception:
            container_text = anchor_text
        container_first = (container_text or "").strip().split("\n")[0][:220]
        label_ok = label_matches_query(label, query)
        if label_ok or label_matches_query(container_first, query):
            px = parse_inr(container_text) or parse_inr(anchor_text)
            if px:
                return px, label if label_ok else container_first, abs_href
    raise RuntimeError(f"No matching product on {host_sub}")


def _extract_products(body: Any) -> list[dict]:
    if isinstance(body, list) and body and isinstance(body[0], dict):
        return body
    if isinstance(body, dict):
        for key in ("products", "data", "result", "results", "items", "medicines", "payload", "productlists"):
            val = body.get(key)
            if isinstance(val, list) and val and isinstance(val[0], dict):
                return val
            if isinstance(val, dict):
                inner = _extract_products(val)
                if inner:
                    return inner
    return []


def _first(p: dict, *keys: str, default: Any = "") -> Any:
    return next((p[k] for k in keys if p.get(k)), default)


async def _pw_with_intercept(page: Page, url: str, pharmacy: str, host_sub: str,
                             href_ok: Callable[[str], bool] | None, q: str) -> dict[str, Any]:
    captured: list[Any] = []

    async def _on_response(response):
        try:
            if response.status == 200 and "json" in response.headers.get("content-type", ""):
                captured.append(await response.json())
        except Exception:
            pass

    page.on("response", _on_response)
    await _goto(page, url)
    await asyncio.sleep(random.uniform(0.5, 1.5))
    await _cookies(page)

    if href_ok:
        try:
            px, lab, href = await _anchor_walk(page, host_sub, href_ok, q)
            return make_result(pharmacy, lab, px, href)
        except RuntimeError:
            pass

    result = await _text_search_fallback(page, q)
    if result:
        return make_result(pharmacy, result[1], result[0], result[2])

    await asyncio.sleep(3)

    for body in captured:
        for p in _extract_products(body):
            name = _first(p, "name", "productName", "medicineName", "medicine_name", "description")
            if not name or not label_matches_query(name, q):
                continue
            price = float(_first(p, "price", "mrp", "selling_price", "sellingPrice", "final_price", "offeredPrice", default=0))
            if price > 0:
                slug = _first(p, "slug", "url", "url_key", "productUrl")
                link = f"https://{host_sub}/{slug}" if slug and not slug.startswith("http") else page.url
                logger.info("%s API intercept: %s ₹%.2f", pharmacy, name, price)
                return make_result(pharmacy, name, price, link)

    raise RuntimeError(f"{pharmacy}: no product found")


async def scrape_1mg_pw(page: Page, q: str) -> dict[str, Any]:
    return await _pw_with_intercept(
        page, f"https://www.1mg.com/search/all?name={quote_plus(q)}",
        "Tata 1mg", "1mg.com", _is_1mg, q)


async def scrape_apollo_pw(page: Page, q: str) -> dict[str, Any]:
    return await _pw_with_intercept(
        page, f"https://www.apollopharmacy.in/search-medicines?keyword={quote_plus(q)}",
        "Apollo Pharmacy", "apollopharmacy.in", _is_ap, q)
