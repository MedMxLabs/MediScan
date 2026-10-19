"""Top-level medicine extraction: per-line Rx parsing, catalog recovery, optional LLM filter."""
from __future__ import annotations

import logging
import os
import re
from dataclasses import dataclass
from typing import Any

from .catalog import (
    _catalog_match,
    _extract_from_catalog_compact,
    _extract_from_catalog_in_document,
    _has_drug_signal,
    _load_catalog,
)
from .combinations import _extract_combination_from_line, _finalize_medicines
from .patterns import (
    _CONCENTRATION_RE,
    _DATE_RE,
    _DRUG_HINT_RE,
    _DRUG_LINE_RE,
    _FREQ_RE,
    _RX_INLINE_RE,
    _RX_PREFIX_RE,
    _STRENGTH_RE,
)
from .text import _is_incomplete_medicine_name, _is_junk_text, _normalize_name, _preprocess_rx_line

logger = logging.getLogger("app.services.medicine_extract_service")


@dataclass
class MedicineExtractResult:
    medicines: list[dict[str, str]]
    medicine_names: list[str]
    extraction_engine: str = "smart_nlp"


def scan_extraction_capabilities() -> dict[str, Any]:
    from app.services.llm_client import scan_llm_capability

    caps = {
        "engine": "smart_nlp",
        "methods": [
            "rx_lines",
            "combination_formulation",
            "drug_strength_lines",
            "catalog_match",
            "catalog_compact",
        ],
        "catalog_terms": len(_load_catalog()),
        "ready": True,
        "strict_mode": True,
    }
    caps.update(scan_llm_capability())
    return caps


def _accept_name(name: str, line: str = "", full_text: str = "") -> str | None:
    clean = _normalize_name(name)
    if not clean or len(clean) < 3 or len(clean) > 120:
        return None
    if _is_incomplete_medicine_name(clean):
        return None
    if _is_junk_text(clean):
        return None
    if not _has_drug_signal(clean, line or clean):
        return None
    cat = _catalog_match(clean, full_text or line)
    if cat:
        return cat
    # Drop trailing junk tokens (e.g. "LINSEE" fragment alone)
    if len(clean.split()) > 4:
        return None
    return clean


def _dedupe(names: list[str]) -> list[str]:
    out: list[str] = []
    seen: set[str] = set()
    for n in names:
        key = n.lower()
        if key in seen:
            continue
        seen.add(key)
        out.append(n)
        if len(out) >= 20:
            break
    return out


def _extract_from_line(line: str, full_text: str) -> list[str]:
    line = _preprocess_rx_line(line)
    if not line or _is_junk_text(line):
        return []

    combo = _extract_combination_from_line(line)
    if combo:
        return [combo["name"]]

    found: list[str] = []

    conc = _CONCENTRATION_RE.search(line)
    if conc and re.search(r"(?i)\b(?:syp|syr|syrup)\b", line):
        drug_m = re.search(
            r"(?i)(?:syp\.?|syr\.?|syrup\s+)?([A-Za-z][A-Za-z\s\-]{2,30}?)\s+"
            + re.escape(conc.group(0)),
            line,
        )
        if drug_m:
            accepted = _accept_name(f"{drug_m.group(1)} {conc.group(0)}", line, full_text)
            if accepted:
                return [accepted]

    for m in _RX_INLINE_RE.finditer(line):
        accepted = _accept_name(m.group(1), line, full_text)
        if accepted:
            found.append(accepted)

    m = _DRUG_LINE_RE.match(line.strip())
    if m:
        accepted = _accept_name(m.group(1), line, full_text)
        if accepted:
            found.append(accepted)

    if _RX_PREFIX_RE.match(line):
        body = _RX_PREFIX_RE.sub("", line.strip())
        strength_m = _STRENGTH_RE.search(body)
        if strength_m:
            accepted = _accept_name(body[: strength_m.start()].strip(), line, full_text)
            if accepted:
                found.append(accepted)

    # Standalone drug line (hospital PDFs): "DICLOFENAC DIETHYLAMINE ..." without Tab prefix
    if not found and _DRUG_HINT_RE.search(line) and not _is_junk_text(line):
        # Take text before strength/frequency if present
        cut = len(line)
        for pat in (_STRENGTH_RE, _FREQ_RE, _DATE_RE):
            m = pat.search(line)
            if m:
                cut = min(cut, m.start())
        accepted = _accept_name(line[:cut].strip(), line, full_text)
        if accepted:
            found.append(accepted)

    return found


def _extract_smart_nlp(text: str) -> MedicineExtractResult:
    """Return medicine names only — strict filter, no document headers or patient info."""
    if not text or not text.strip():
        return MedicineExtractResult(medicines=[], medicine_names=[], extraction_engine="none")

    lines = [_preprocess_rx_line(ln) for ln in text.splitlines() if ln.strip()]
    lines = [re.sub(r"\s+", " ", ln) for ln in lines if ln]
    candidates: list[str] = []

    for line in lines:
        candidates.extend(_extract_from_line(line, text))

    # Catalog hits only when drug appears in a line that also has Rx/strength context nearby
    for line in lines:
        if _STRENGTH_RE.search(line) or _RX_PREFIX_RE.search(line) or _FREQ_RE.search(line):
            candidates.extend(_extract_from_catalog_in_document(line))

    names = _dedupe(candidates)
    return MedicineExtractResult(
        medicines=[{"name": n} for n in names],
        medicine_names=names,
        extraction_engine="smart_nlp" if names else "none",
    )


def extract_medicine_names(text: str) -> MedicineExtractResult:
    """Smart NLP + catalog compact; optional LLM filter when MEDSCAN_LLM_MEDICINE_FILTER=1."""
    if not text or not text.strip():
        return MedicineExtractResult(medicines=[], medicine_names=[], extraction_engine="none")

    nlp = _extract_smart_nlp(text)
    names = list(nlp.medicine_names)
    engine = nlp.extraction_engine

    compact = _extract_from_catalog_compact(text)
    if compact:
        merged = _dedupe(names + compact)
        if len(merged) > len(names):
            names = merged
            if engine == "smart_nlp":
                engine = "smart_nlp+catalog_compact"
            elif engine == "none":
                engine = "catalog_compact"

    llm_names = None
    try:
        from app.services.medicine_llm_filter import extract_medicines_via_llm

        llm_names = extract_medicines_via_llm(text)
    except Exception as exc:
        logger.warning("LLM medicine filter skipped: %s", exc)

    if llm_names is not None:
        mode = os.environ.get("MEDSCAN_LLM_MEDICINE_MODE", "merge").strip().lower()
        if mode == "llm_primary" and llm_names:
            names = llm_names
            engine = "llm_filter"
        elif mode == "llm_only":
            names = llm_names
            engine = "llm_filter" if llm_names else "none"
        elif llm_names:
            names = _dedupe(names + llm_names)
            if engine == "none":
                engine = "llm_filter"
            elif "llm" not in engine:
                engine = f"{engine}+llm"

    names, medicines = _finalize_medicines(names, text)
    if any(m.get("kind") == "combination" for m in medicines):
        if engine == "none":
            engine = "combination_formulation"
        elif "combination" not in engine:
            engine = f"{engine}+combination"

    return MedicineExtractResult(
        medicines=medicines,
        medicine_names=names,
        extraction_engine=engine if names else "none",
    )
