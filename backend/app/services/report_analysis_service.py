"""Lab report analysis — OCR + rule-based markers + plain-language summary."""
from __future__ import annotations

from typing import Any

from app.services import report_service


def analyze_lab_text(raw: str) -> list[dict[str, Any]]:
    return report_service.analyze_lab_text(raw)


def deviation_summary(row: dict[str, Any]) -> str:
    """Human-readable deviation line for UI tables."""
    nm = str(row.get("name", "")).strip()
    val = row.get("value")
    unit = str(row.get("unit", "") or "").strip()
    flag = str(row.get("flag", "")).strip()
    lo, hi = row.get("ref_low"), row.get("ref_high")
    if flag == "normal":
        return f"{nm} within reference."
    if flag == "low" and lo is not None:
        try:
            delta = float(lo) - float(val)
            return f"{nm} low by ~{delta:.1f} {unit}".strip()
        except (TypeError, ValueError):
            return f"{nm} below reference range."
    if flag == "high" and hi is not None:
        try:
            delta = float(val) - float(hi)
            return f"{nm} high by ~{delta:.1f} {unit}".strip()
        except (TypeError, ValueError):
            return f"{nm} above reference range."
    return f"{nm}: status {flag}."


def enrich_rows(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    out = []
    for r in rows:
        copy = dict(r)
        copy["deviation"] = deviation_summary(r)
        out.append(copy)
    return out


def _deterministic_lab_insights(rows: list[dict[str, Any]]) -> str:
    lines: list[str] = []
    for r in rows:
        nm = str(r.get("name", "")).strip()
        val = r.get("value")
        flag = str(r.get("flag", "")).strip()
        rl, rh = r.get("ref_low"), r.get("ref_high")
        unit = str(r.get("unit", "") or "").strip()
        if flag == "normal":
            lines.append(f"{nm}: {val} {unit} is within stated reference {rl}–{rh} {unit}.".strip())
        elif flag == "high":
            lines.append(f"{nm}: {val} {unit} is above reference {rl}–{rh} {unit}.".strip())
        elif flag == "low":
            lines.append(f"{nm}: {val} {unit} is below reference {rl}–{rh} {unit}.".strip())
    if not lines:
        return ""
    disclaimer = (
        "This summary compares extracted values to reference intervals stored in MedMx — not a diagnosis. "
        "Discuss results with your clinician."
    )
    return "\n".join(lines) + "\n\n" + disclaimer


def insights_plain_language(rows: list[dict[str, Any]]) -> str:
    return _deterministic_lab_insights(rows)
