"""httpx scrapers: PharmEasy, Netmeds, TrueMeds, MedPlus."""
from __future__ import annotations

import re
from typing import Any
from urllib.parse import quote_plus, urlparse

import httpx

from .common import PROXY_URL, httpx_headers, label_matches_query, logger, make_result, next_data, product_from_page
from .discovery import find_product_url


async def _get_page(url: str) -> httpx.Response:
    async with httpx.AsyncClient(headers=httpx_headers(), follow_redirects=True, timeout=25) as c:
        return await c.get(url)


async def scrape_pharmeasy_httpx(q: str) -> dict[str, Any]:
    """httpx + __NEXT_DATA__ search results."""
    url = f"https://pharmeasy.in/search/all?name={quote_plus(q)}"
    async with httpx.AsyncClient(
        headers=httpx_headers(), follow_redirects=True, timeout=25, proxy=PROXY_URL or None,
    ) as c:
        r = await c.get(url)
    r.raise_for_status()
    data = next_data(r.text)
    if data is None:
        raise RuntimeError("PharmEasy: __NEXT_DATA__ not found")
    for p in data.get("props", {}).get("pageProps", {}).get("searchResults", []):
        name = p.get("name", "")
        if not label_matches_query(name, q):
            continue
        mrp = float(p.get("mrpDecimal") or p.get("salePriceDecimal") or 0)
        if mrp <= 0:
            continue
        slug = p.get("slug", "")
        link = f"https://pharmeasy.in/online-medicine-order/{slug}" if slug else url
        logger.info("PharmEasy httpx: %s ₹%.2f", name, mrp)
        return make_result("PharmEasy", name, mrp, link, p.get("subtitleText", ""))
    raise RuntimeError("PharmEasy: no matching product in __NEXT_DATA__")


async def scrape_netmeds_httpx(q: str) -> dict[str, Any]:
    """httpx + internal JSON search API."""
    api_url = f"https://www.netmeds.com/ext/search/application/api/v1.0/products?q={quote_plus(q)}"
    headers = {
        **httpx_headers(),
        "Accept": "application/json",
        "Referer": "https://www.netmeds.com/",
        "Origin": "https://www.netmeds.com",
    }
    async with httpx.AsyncClient(headers=headers, follow_redirects=True, timeout=25) as c:
        r = await c.get(api_url)
    r.raise_for_status()
    for item in r.json().get("items", []):
        name = item.get("name", "")
        if not label_matches_query(name, q):
            continue
        price_info = item.get("price", {})
        price = price_info.get("effective", {}).get("min", 0) or price_info.get("marked", {}).get("min", 0)
        if price <= 0:
            continue
        slug = item.get("slug", "")
        link = f"https://www.netmeds.com/product/{slug}" if slug else api_url
        sizes = item.get("sizes", [])
        pack = ""
        if sizes:
            pack = str(sizes[0].get("size", "")) if isinstance(sizes[0], dict) else str(sizes[0])
        logger.info("Netmeds httpx: %s ₹%.2f", name, price)
        return make_result("Netmeds", name, price, link, pack)
    raise RuntimeError("Netmeds: no matching product in search API")


_TM_BUILD_ID: str | None = None


async def _get_truemeds_build_id() -> str | None:
    """Fetch the Next.js buildId from TrueMeds — needed for JSON data route."""
    global _TM_BUILD_ID  # noqa: PLW0603
    if _TM_BUILD_ID:
        return _TM_BUILD_ID
    try:
        async with httpx.AsyncClient(headers=httpx_headers(), follow_redirects=True, timeout=12) as c:
            r = await c.get("https://www.truemeds.in")
        m = re.search(r'"buildId"\s*:\s*"([^"]+)"', r.text)
        if m:
            _TM_BUILD_ID = m.group(1)
            logger.info("TrueMeds buildId: %s", _TM_BUILD_ID)
            return _TM_BUILD_ID
    except Exception as exc:
        logger.debug("Failed to get TrueMeds buildId: %s", exc)
    return None


def _extract_truemeds_data(pp: dict, product_url: str) -> dict[str, Any] | None:
    """Extract product data from TrueMeds pageProps dict."""
    for key in ("currentMed", "originalMedicineDetails"):
        med = pp.get(key, {})
        prod = med.get("product", {}) if isinstance(med, dict) else {}
        name = prod.get("skuName", "")
        if not name:
            continue
        price = prod.get("sellingPrice") or prod.get("mrp") or 0
        if price <= 0:
            continue
        logger.info("TrueMeds: %s ₹%.2f", name, price)
        return make_result("TrueMeds", name, price, product_url, prod.get("packForm", ""))
    return None


async def scrape_truemeds_httpx(q: str) -> dict[str, Any]:
    """Discovered product page: _next/data JSON, then __NEXT_DATA__, then JSON-LD/HTML."""
    product_url = await find_product_url(q, "truemeds.in", path_hints=("/otc/", "/medicine/"))
    if not product_url:
        raise RuntimeError("TrueMeds: could not find product URL via search")

    build_id = await _get_truemeds_build_id()
    if build_id:
        try:
            slug = urlparse(product_url).path.strip("/")
            async with httpx.AsyncClient(headers=httpx_headers(), follow_redirects=True, timeout=20) as c:
                r = await c.get(f"https://www.truemeds.in/_next/data/{build_id}/{slug}.json")
            if r.status_code == 200 and "json" in r.headers.get("content-type", ""):
                result = _extract_truemeds_data(r.json().get("pageProps", {}), product_url)
                if result:
                    return result
        except Exception as exc:
            logger.debug("TrueMeds _next/data failed: %s", exc)

    r = await _get_page(product_url)
    if r.status_code != 200:
        raise RuntimeError(f"TrueMeds: product page returned {r.status_code}")
    nd = next_data(r.text)
    result = (nd and _extract_truemeds_data(nd.get("props", {}).get("pageProps", {}), product_url)) or (
        product_from_page(r.text, "TrueMeds", product_url)
    )
    if result:
        return result
    raise RuntimeError("TrueMeds: no price data found on product page")


async def scrape_medplus_httpx(q: str) -> dict[str, Any]:
    """Discovered product page: JSON-LD, then HTML."""
    product_url = await find_product_url(q, "medplusmart.com", path_hints=("/product/",))
    if not product_url:
        raise RuntimeError("MedPlus: could not find product URL via search")
    r = await _get_page(product_url)
    if r.status_code != 200:
        raise RuntimeError(f"MedPlus: product page returned {r.status_code}")
    result = product_from_page(r.text, "MedPlus", product_url)
    if result:
        return result
    raise RuntimeError("MedPlus: no price data in JSON-LD or HTML")
