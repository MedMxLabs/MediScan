"""Medicine catalog seed lookup used to confirm and recover drug names."""
from __future__ import annotations

import json
import logging
import os
import re

from .patterns import _DRUG_HINT_RE, _FREQ_RE, _PHARMA_SUFFIX_RE, _RX_PREFIX_RE, _STRENGTH_RE
from .text import _is_junk_text, _normalize_name

logger = logging.getLogger("app.services.medicine_extract_service")

_CATALOG_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "data", "medicine_catalog_seed.json")
_CATALOG_LOOKUP: dict[str, str] | None = None
# (lookup it was built from, [(key, display, word-boundary regex)]) for keys of 5+ chars.
_CATALOG_PATTERNS: tuple[dict[str, str], list[tuple[str, str, re.Pattern]]] | None = None


def _load_catalog() -> dict[str, str]:
    global _CATALOG_LOOKUP
    if _CATALOG_LOOKUP is not None:
        return _CATALOG_LOOKUP

    lookup: dict[str, str] = {}
    try:
        with open(_CATALOG_PATH, encoding="utf-8") as fp:
            rows = json.load(fp)
        for row in rows:
            composition = (row.get("composition") or "").strip()
            generic = (row.get("generic_name") or "").strip()
            if composition:
                lookup[composition.lower()] = _normalize_name(composition)
            if generic and generic.lower() not in lookup:
                if not composition or generic.lower() not in composition.lower():
                    lookup[generic.lower()] = _normalize_name(generic)
            for field in ("generic_name", "name", "composition"):
                raw = (row.get(field) or "").strip()
                if not raw or "+" not in raw:
                    continue
                for part in re.split(r"\s*\+\s*", raw):
                    part = re.sub(r"\s+\d+.*$", "", part.strip())
                    if len(part) >= 4:
                        lookup.setdefault(part.lower(), _normalize_name(part))
            brand = (row.get("name") or "").strip()
            if brand:
                token = brand.split()[0]
                if len(token) >= 4:
                    lookup.setdefault(token.lower(), _normalize_name(token))
    except Exception as exc:
        logger.warning("Could not load medicine catalog seed: %s", exc)

    _CATALOG_LOOKUP = lookup
    return lookup


def _catalog_patterns() -> list[tuple[str, str, re.Pattern]]:
    global _CATALOG_PATTERNS
    lookup = _load_catalog()
    if _CATALOG_PATTERNS is None or _CATALOG_PATTERNS[0] is not lookup:
        compiled = [
            (key, display, re.compile(rf"\b{re.escape(key)}\b"))
            for key, display in lookup.items()
            if len(key) >= 5
        ]
        _CATALOG_PATTERNS = (lookup, compiled)
    return _CATALOG_PATTERNS[1]


def _catalog_match(name: str, full_text: str) -> str | None:
    lookup = _load_catalog()
    key = name.lower()
    if key in lookup:
        return lookup[key]
    patterns = _catalog_patterns()
    for _cat_key, display, pat in patterns:
        if pat.search(key):
            return display
    # Substring in document for multi-word generics
    lower_doc = full_text.lower()
    for cat_key, display, pat in patterns:
        if len(cat_key) >= 6 and (cat_key in key or key in cat_key) and pat.search(lower_doc):
            return display
    return None


def _has_drug_signal(name: str, line: str = "") -> bool:
    blob = f"{name} {line}"
    if _DRUG_HINT_RE.search(blob):
        return True
    if _catalog_match(name, line) or _catalog_match(name, blob):
        return True
    # Tab/Cap + strength is not enough — name must look like a drug, not random OCR text
    if _STRENGTH_RE.search(line or blob) and (
        _PHARMA_SUFFIX_RE.search(name.strip()) or _DRUG_HINT_RE.search(name)
    ):
        return True
    return False


def _extract_from_catalog_in_document(text: str) -> list[str]:
    lower = text.lower()
    return [display for _k, display, pat in _catalog_patterns() if pat.search(lower) and not _is_junk_text(display)]


def _document_has_rx_context(text: str) -> bool:
    for ln in text.splitlines():
        s = ln.strip()
        if s and (_STRENGTH_RE.search(s) or _RX_PREFIX_RE.search(s) or _FREQ_RE.search(s)):
            return True
    return False


def _extract_from_catalog_compact(text: str) -> list[str]:
    """Recover catalog drugs when OCR splits words (e.g. Diclofe nac → diclofenac)."""
    if not _document_has_rx_context(text):
        return []
    lookup = _load_catalog()
    compact = re.sub(r"[^a-z0-9]", "", text.lower())
    if len(compact) < 8:
        return []
    found: list[str] = []
    for cat_key, display in lookup.items():
        key_compact = re.sub(r"[^a-z0-9]", "", cat_key)
        if len(key_compact) >= 6 and key_compact in compact:
            if not _is_junk_text(display):
                found.append(display)
    return found
