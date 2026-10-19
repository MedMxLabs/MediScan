"""Line cleanup and junk filters for prescription OCR text."""
from __future__ import annotations

import re

from .patterns import (
    _CONCENTRATION_RE,
    _DATE_RE,
    _DEMO_RE,
    _DRUG_HINT_RE,
    _FREQ_RE,
    _JUNK_RE,
    _STRENGTH_RE,
    _TIME_ONLY_RE,
)


def _normalize_name(raw: str) -> str:
    name = raw.strip()
    name = re.sub(r"(?i)^(?:\d+[\).\s]+)", "", name)
    name = re.sub(r"(?i)^(?:tab\.?|cap\.?|syp\.?|syr\.?|inj\.?|drops\.?)\s+", "", name)
    name = re.sub(r"(?i),?\s*single\s+(?:tab|cap|tablet|capsule)s?\b", "", name)
    name = re.sub(r"(?i)\s*oral\s+(?:tab(?:let)?|cap(?:sule)?|tab/cap)s?\b", "", name)
    concentrations = _CONCENTRATION_RE.findall(name)
    name = _STRENGTH_RE.sub("", name)
    name = _FREQ_RE.sub("", name)
    name = re.sub(r"\bfor\s+\d+\s*(?:day|days|week|weeks|month|months)\b", "", name, flags=re.I)
    name = re.sub(r"[^\w\s+\-/]", " ", name)
    name = re.sub(r"\s+", " ", name).strip(" .,-/\\")
    for conc in concentrations:
        conc_clean = re.sub(r"\s+", " ", conc.strip())
        if conc_clean.lower() not in name.lower():
            name = f"{name} {conc_clean}".strip()
    name = re.sub(r"\s+", " ", name).strip(" .,-/\\")
    return name


def _preprocess_rx_line(line: str) -> str:
    s = re.sub(r"\s+", " ", line.strip())
    s = re.sub(r"(?i)^\d+[\).\s]+", "", s)
    s = re.sub(r"(?i),?\s*single\s+(?:tab|cap|tablet|capsule)s?\b", "", s)
    return s.strip()


def _normalize_medicine_key(name: str) -> str:
    s = _preprocess_rx_line(name or "")
    s = s.lower()
    s = re.sub(r"(?i)\s*oral\s+(?:tab(?:let)?|cap(?:sule)?|tab/cap)s?\b", " ", s)
    s = re.sub(r"[^\w\s+]", " ", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s


def _is_incomplete_medicine_name(name: str) -> bool:
    clean = (name or "").strip()
    if not clean or len(clean) < 3:
        return True
    if re.search(r"[/\\]\s*$", clean):
        return True
    if re.fullmatch(r"(?i)[a-z]{3,20}\s*[/\\]\s*", clean):
        return True
    return False


def _is_junk_text(text: str) -> bool:
    t = (text or "").strip()
    if not t or len(t) < 3:
        return True
    if _JUNK_RE.search(t):
        return True
    if _DATE_RE.search(t):
        return True
    if _DEMO_RE.search(t):
        return True
    if _TIME_ONLY_RE.match(t):
        return True
    if re.fullmatch(r"(?i)(cr no\.?|emd|opd|ipd|uhid|eval|routine)", t):
        return True
    # Person name: two title-case words, no drug signal
    parts = t.split()
    if len(parts) == 2 and all(p[:1].isupper() for p in parts if p):
        if not _DRUG_HINT_RE.search(t) and not _STRENGTH_RE.search(t):
            return True
    # ALL CAPS section header (3+ chars words, no digits, no drug hint)
    if t.isupper() and len(parts) >= 2 and not _DRUG_HINT_RE.search(t):
        if not _STRENGTH_RE.search(t):
            return True
    return False
