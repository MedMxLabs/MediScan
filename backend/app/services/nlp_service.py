"""Parse OCR output into structured medicine mentions (regex-based prescription NLP)."""
from __future__ import annotations

import re
from typing import Any

PREFIX_RE = re.compile(r"(?i)^(?:\d+[\).\s]*)?(?:(?:tab\.?|cap\.?|syp\.?|syr\.?|inj\.?|drops\.?)\s*)")
STRENGTH_RE = re.compile(r"(?i)\b([\d.]+\s*(?:mg|ml|gm|g|mcg|iu|%|units?))\b")
FREQ_SLOT_RE = re.compile(r"(?i)\b(\d+)\s*[-–]\s*(\d+)\s*[-–]\s*(\d+)\b")
FREQ_WORD_RE = re.compile(r"(?i)\b(od|bd|tds|qid|hs|sos|once daily|twice daily|thrice daily)\b")
FREQ_TIMES_RE = re.compile(r"(?i)(\d+)\s*(?:times?|x)\s*(?:a\s*)?(day|daily|week|od|bd|tds|hs)")
DURATION_RE = re.compile(r"(?i)(?:for\s*)?(\d+)\s*(day|days|week|weeks|month|months)")
SKIP_LINE_RE = re.compile(
    r"(?i)^(signature|doctor|dr\.|patient|name|age|sex|date|prescription|rx\b|hospital|clinic|address|phone|reg\.?no)"
)


def _normalize_freq(text: str) -> str | None:
    m = FREQ_SLOT_RE.search(text)
    if m:
        return f"{m.group(1)}-{m.group(2)}-{m.group(3)}"
    m = FREQ_WORD_RE.search(text)
    if m:
        return m.group(1).upper()
    m = FREQ_TIMES_RE.search(text)
    if m:
        return f"{m.group(1)} times {m.group(2)}"
    return None


def _normalize_duration(text: str) -> str | None:
    m = DURATION_RE.search(text)
    if m:
        return f"{m.group(1)} {m.group(2)}"
    return None


def _clean_name(raw: str) -> str:
    name = PREFIX_RE.sub("", raw).strip(" .,-")
    name = re.sub(r"\s+", " ", name)
    return name


def _parse_line(ln: str) -> dict[str, Any] | None:
    if SKIP_LINE_RE.match(ln):
        return None

    body = PREFIX_RE.sub("", ln).strip()
    if len(body) < 2:
        return None

    strength_m = STRENGTH_RE.search(body)
    if strength_m:
        name = body[: strength_m.start()].strip(" .,-")
        dosage = strength_m.group(1).strip()
    else:
        # No explicit strength — treat first 1–4 words as name if line looks like a drug line
        tokens = body.split()
        if len(tokens) >= 2 and tokens[0].isalpha():
            name = " ".join(tokens[: min(4, len(tokens))])
            dosage = ""
        else:
            name = body[:80]
            dosage = ""

    name = re.sub(r"\s+", " ", name).strip(" .,-")
    if len(name) < 2 or SKIP_LINE_RE.match(name):
        return None

    return {
        "name": name,
        "dosage": dosage,
        "strength_hint": dosage,
        "frequency": _normalize_freq(ln),
        "duration": _normalize_duration(ln),
    }


def parse_medicines_from_text(text: str) -> list[dict[str, Any]]:
    if not text or not text.strip():
        return []

    lines = [re.sub(r"\s+", " ", ln.strip()) for ln in text.splitlines() if ln.strip()]
    out: list[dict[str, Any]] = []
    seen: set[str] = set()

    for ln in lines:
        if len(out) >= 32:
            break
        parsed = _parse_line(ln)
        if not parsed:
            continue
        key = parsed["name"].lower()
        if key in seen:
            continue
        seen.add(key)
        out.append(parsed)

    if not out and text.strip():
        out.append(
            {
                "name": text.strip()[:80],
                "dosage": "",
                "strength_hint": "",
                "frequency": _normalize_freq(text),
                "duration": _normalize_duration(text),
            }
        )
    return out
