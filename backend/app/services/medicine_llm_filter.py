"""LLM-assisted medicine extraction from messy prescription OCR (OpenAI / DeepSeek / Azure)."""
from __future__ import annotations

import logging
import re

from app.services import llm_client
from app.services.medicine_extract_service import (
    _DRUG_HINT_RE,
    _PHARMA_SUFFIX_RE,
    _STRENGTH_RE,
    _catalog_match,
    _is_incomplete_medicine_name,
    _is_junk_text,
    _normalize_name,
)

logger = logging.getLogger(__name__)

_SYSTEM_PROMPT = """You extract prescribed medicine names from Indian prescription OCR text.
Return JSON only: {"medicines": ["...", ...]}

Rules:
- Each item is one medicine (include strength like 650mg, 5ml, 1.16% when visible in text)
- EXCLUDE patient names, doctor names, hospital/clinic, dates, CR/UHID/OPD, diagnoses,
  chief complaint, lab tests, vitals, signatures, page headers
- Do NOT invent medicines that are not in the OCR text
- Maximum 20 medicines
- Empty array if no medicines found"""


def _validate_llm_medicine(name: str, full_text: str) -> str | None:
    """Validate LLM output — slightly looser than strict Rx regex, still blocks junk."""
    clean = _normalize_name(name)
    if not clean or len(clean) < 3 or len(clean) > 120:
        return None
    if _is_incomplete_medicine_name(clean):
        return None
    if _is_junk_text(clean):
        return None

    cat = _catalog_match(clean, full_text)
    if cat:
        return cat

    if _DRUG_HINT_RE.search(clean) or _STRENGTH_RE.search(clean) or _PHARMA_SUFFIX_RE.search(clean):
        return clean

    parts = clean.split()
    if len(parts) == 2 and all(p[:1].isupper() for p in parts if p):
        if not _DRUG_HINT_RE.search(clean):
            return None

    if len(clean) >= 5 and re.search(r"(?i)(tab|cap|syp|gel|oint|inj|drops|susp)", clean):
        return clean

    return None


def _parse_medicine_list(payload: dict | None) -> list[str]:
    if not payload:
        return []
    raw = payload.get("medicines") or payload.get("medicine_names") or payload.get("drugs") or []
    if isinstance(raw, str):
        raw = [raw]
    if not isinstance(raw, list):
        return []
    out: list[str] = []
    for item in raw:
        if isinstance(item, str) and item.strip():
            out.append(item.strip())
        elif isinstance(item, dict):
            name = (item.get("name") or item.get("medicine") or "").strip()
            if name:
                out.append(name)
    return out


def extract_medicines_via_llm(text: str) -> list[str] | None:
    """
    Call configured LLM to extract medicine names from OCR text.
    Returns validated names, empty list if LLM ran but found nothing, None if unavailable/failed.
    """
    if not text or not text.strip() or not llm_client.is_llm_configured():
        return None

    snippet = text.strip()[:7000]
    payload = llm_client.chat_json(_SYSTEM_PROMPT, f"OCR text:\n{snippet}")
    if payload is None:
        return None

    validated: list[str] = []
    seen: set[str] = set()
    for raw in _parse_medicine_list(payload):
        accepted = _validate_llm_medicine(raw, text)
        if not accepted:
            continue
        key = accepted.lower()
        if key in seen:
            continue
        seen.add(key)
        validated.append(accepted)
        if len(validated) >= 20:
            break

    logger.info("LLM medicine filter: %d names from model, %d after validation", len(_parse_medicine_list(payload)), len(validated))
    return validated
