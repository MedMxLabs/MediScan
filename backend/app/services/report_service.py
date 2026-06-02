"""Lab report parsing and reference-range comparison."""
from __future__ import annotations

import re
from typing import Any

REFERENCE: dict[str, tuple[float | None, float | None, str]] = {
    "hemoglobin": (13.5, 17.5, "g/dL"),
    "hba1c": (4.0, 5.6, "%"),
    "fasting glucose": (70, 100, "mg/dL"),
    "random glucose": (70, 140, "mg/dL"),
    "total cholesterol": (0.0, 200.0, "mg/dL"),
    "ldl": (0.0, 100.0, "mg/dL"),
    "hdl": (40.0, 60.0, "mg/dL"),
    "triglycerides": (0.0, 150.0, "mg/dL"),
    "creatinine": (0.7, 1.3, "mg/dL"),
    "urea": (15.0, 40.0, "mg/dL"),
    "bun": (7.0, 20.0, "mg/dL"),
    "tsh": (0.4, 4.0, "mIU/L"),
    "vitamin d": (30.0, 100.0, "ng/mL"),
    "sgpt": (0.0, 40.0, "U/L"),
    "sgot": (0.0, 40.0, "U/L"),
    "alt": (0.0, 40.0, "U/L"),
    "ast": (0.0, 40.0, "U/L"),
    "platelet": (150.0, 410.0, "10^3/uL"),
    "wbc": (4.0, 11.0, "10^3/uL"),
    "rbc": (4.5, 5.5, "10^6/uL"),
    "esr": (0.0, 20.0, "mm/hr"),
    "uric acid": (3.5, 7.2, "mg/dL"),
    "bilirubin total": (0.1, 1.2, "mg/dL"),
    "alkaline phosphatase": (44.0, 147.0, "U/L"),
    "total protein": (6.0, 8.3, "g/dL"),
    "albumin": (3.5, 5.5, "g/dL"),
    "sodium": (136.0, 145.0, "mEq/L"),
    "potassium": (3.5, 5.1, "mEq/L"),
    "chloride": (98.0, 107.0, "mEq/L"),
}

# Aliases → canonical REFERENCE key (longest match wins)
MARKER_ALIASES: list[tuple[str, str]] = sorted(
    [
        (r"haemoglobin|hemoglobin|\bhb\b|\bhgb\b", "hemoglobin"),
        (r"glycated\s*haemoglobin|glycated\s*hemoglobin|\bhba1c\b|\ba1c\b", "hba1c"),
        (r"fasting\s*blood\s*sugar|fasting\s*glucose|\bfbs\b|f\.?\s*bs", "fasting glucose"),
        (r"random\s*blood\s*sugar|random\s*glucose|\brbs\b|pp\s*blood\s*sugar", "random glucose"),
        (r"total\s*cholesterol|\bcholesterol\b(?!\s*hdl|\s*ldl)", "total cholesterol"),
        (r"\bldl\b|ldl\s*cholesterol", "ldl"),
        (r"\bhdl\b|hdl\s*cholesterol", "hdl"),
        (r"triglyceride?s?", "triglycerides"),
        (r"serum\s*creatinine|creatinine", "creatinine"),
        (r"blood\s*urea|\burea\b", "urea"),
        (r"blood\s*urea\s*nitrogen|\bbun\b", "bun"),
        (r"thyroid\s*stimulating\s*hormone|\btsh\b", "tsh"),
        (r"vitamin\s*d3?|\b25\s*\(?oh\s*\)?\s*d", "vitamin d"),
        (r"\bsgpt\b|\balt\b", "sgpt"),
        (r"\bsgot\b|\bast\b", "ast"),
        (r"platelet\s*count|platelets|\bplt\b", "platelet"),
        (r"total\s*leucocyte\s*count|total\s*leukocyte\s*count|\bwbc\b|\btlc\b", "wbc"),
        (r"total\s*red\s*blood\s*cell|\brbc\b|\berythrocyte", "rbc"),
        (r"\besr\b|erythrocyte\s*sedimentation", "esr"),
        (r"uric\s*acid", "uric acid"),
        (r"total\s*bilirubin|bilirubin\s*\(?total\)?", "bilirubin total"),
        (r"alkaline\s*phosphatase|\balp\b", "alkaline phosphatase"),
        (r"total\s*protein", "total protein"),
        (r"\balbumin\b", "albumin"),
        (r"\bsodium\b|\bna\b", "sodium"),
        (r"\bpotassium\b|\bk\b", "potassium"),
        (r"\bchloride\b|\bcl\b", "chloride"),
    ],
    key=lambda x: len(x[0]),
    reverse=True,
)

_FLOAT_RE = re.compile(r"(?<![\d.])([\d]+(?:\.\d+)?)(?![\d.])")
_RANGE_RE = re.compile(r"([\d.]+)\s*[-–]\s*([\d.]+)")


def normalize_lab_text(raw: str) -> str:
    """Clean OCR noise before biomarker extraction."""
    from app.services.ocr_service import normalize_ocr_text

    t = normalize_ocr_text(raw or "")
    t = t.replace("₹", "").replace(" l ", " 1 ").replace(" O ", " 0 ")
    t = re.sub(r"[\t|]+", " ", t)
    t = re.sub(r"\s{2,}", " ", t)
    return t


def _match_ref(canonical: str) -> tuple[float | None, float | None, str]:
    tup = REFERENCE.get(canonical)
    if tup:
        return tup[0], tup[1], tup[2]
    return None, None, ""


def _display_name(canonical: str) -> str:
    return canonical.title()


def _range_numbers(line: str) -> set[float]:
    nums: set[float] = set()
    for m in _RANGE_RE.finditer(line):
        try:
            nums.add(float(m.group(1)))
            nums.add(float(m.group(2)))
        except ValueError:
            pass
    return nums


def _pick_result_value(line: str, after_idx: int) -> float | None:
    tail = line[after_idx:]
    ref_nums = _range_numbers(tail)
    candidates: list[float] = []
    for m in _FLOAT_RE.finditer(tail):
        try:
            val = float(m.group(1))
        except ValueError:
            continue
        if val > 10_000 or val < 0:
            continue
        if val in ref_nums:
            continue
        # Skip year-like integers from report headers
        if val >= 1900 and val <= 2100 and "." not in m.group(1):
            continue
        candidates.append(val)
    return candidates[0] if candidates else None


def _extract_from_line(line: str) -> list[tuple[str, float]]:
    """Return list of (canonical_key, value) found on one line."""
    found: list[tuple[str, float]] = []
    lower = line.lower()
    for pattern, canonical in MARKER_ALIASES:
        m = re.search(pattern, lower, re.I)
        if not m:
            continue
        val = _pick_result_value(line, m.end())
        if val is None:
            continue
        found.append((canonical, val))
    return found


def analyze_lab_text(raw: str) -> list[dict[str, Any]]:
    text = normalize_lab_text(raw)
    if not text.strip():
        return []

    rows: list[dict[str, Any]] = []
    seen: set[str] = set()

    for line in text.splitlines():
        line = line.strip()
        if len(line) < 4:
            continue
        if re.match(r"(?i)^(patient|name|age|sex|date|report|lab|sample|doctor|ref\.?|unit|test|result)", line):
            continue
        for canonical, val in _extract_from_line(line):
            if canonical in seen:
                continue
            seen.add(canonical)
            lo, hi, unit = _match_ref(canonical)
            flag = "normal"
            if lo is not None and hi is not None:
                if val < lo:
                    flag = "low"
                elif val > hi:
                    flag = "high"
            rows.append(
                {
                    "name": _display_name(canonical),
                    "value": val,
                    "unit": unit,
                    "ref_low": lo,
                    "ref_high": hi,
                    "flag": flag,
                }
            )

    # Whole-text pass for markers split across OCR fragments
    if len(rows) < 3:
        blob = " ".join(text.split())
        for pattern, canonical in MARKER_ALIASES:
            if canonical in seen:
                continue
            m = re.search(rf"(?:{pattern})\s*[:\-]?\s*([\d.]+)", blob, re.I)
            if not m:
                continue
            try:
                val = float(m.group(1))
            except ValueError:
                continue
            seen.add(canonical)
            lo, hi, unit = _match_ref(canonical)
            flag = "normal"
            if lo is not None and hi is not None:
                if val < lo:
                    flag = "low"
                elif val > hi:
                    flag = "high"
            rows.append(
                {
                    "name": _display_name(canonical),
                    "value": val,
                    "unit": unit,
                    "ref_low": lo,
                    "ref_high": hi,
                    "flag": flag,
                }
            )

    return rows
