"""Azure OpenAI chat completions."""
from __future__ import annotations

import json
import logging
import os
import re
from typing import Any

import requests

logger = logging.getLogger(__name__)


class LLMConfigurationError(Exception):
    """Raised when AZURE_OPENAI_* settings are missing."""


def _llm_endpoint() -> tuple[str, str]:
    base = os.environ.get("AZURE_OPENAI_API_BASE", "").strip().rstrip("/")
    key = os.environ.get("AZURE_OPENAI_API_KEY", "").strip()
    return base, key


def _azure_chat_url(base: str) -> str:
    """Build Azure OpenAI chat/completions URL (not OpenAI /v1/ format)."""
    api_version = os.environ.get("AZURE_OPENAI_API_VERSION", "2024-08-01-preview").strip()
    root = base.rstrip("/")

    if root.endswith("/chat/completions"):
        if "api-version=" in root:
            return root
        sep = "&" if "?" in root else "?"
        return f"{root}{sep}api-version={api_version}"

    if "/openai/deployments/" in root:
        return f"{root}/chat/completions?api-version={api_version}"

    model = os.environ.get("AZURE_OPENAI_MODEL", "gpt-4.1-mini").strip()
    return f"{root}/openai/deployments/{model}/chat/completions?api-version={api_version}"


def llm_is_configured() -> bool:
    b, k = _llm_endpoint()
    return bool(b and k)


def chat_completion(messages: list[dict[str, str]], user_context: str | None = None) -> str:
    base, key = _llm_endpoint()
    if not base or not key:
        raise LLMConfigurationError("Configure AZURE_OPENAI_API_BASE and AZURE_OPENAI_API_KEY")

    combined = ""
    if user_context:
        combined = "[User profile context]\n" + user_context + "\n\n"
    msgs = [
        {
            "role": "system",
            "content": combined
            + "You are MedScan Health Assistant — informational only, not medical advice. India context.",
        }
    ] + messages[-12:]

    url = _azure_chat_url(base)
    r = requests.post(
        url,
        headers={"api-key": key, "Content-Type": "application/json"},
        json={"messages": msgs, "temperature": 0.3},
        timeout=90,
    )
    r.raise_for_status()
    data: dict[str, Any] = r.json()
    choices = data.get("choices") or []
    if not choices:
        return ""
    msg = choices[0].get("message") or {}
    return (msg.get("content") or "").strip()


def _deterministic_lab_commentary(rows: list[dict[str, Any]]) -> str:
    lines: list[str] = []
    for r in rows:
        nm = str(r.get("name", "")).strip()
        val = r.get("value")
        flag = str(r.get("flag", "")).strip()
        rl, rh = r.get("ref_low"), r.get("ref_high")
        unit = str(r.get("unit", "") or "").strip()
        if flag == "normal":
            lines.append(f"{nm}: {val} {unit} is within stated reference {(rl)}–{(rh)} {unit}.".strip())
        elif flag == "high":
            lines.append(f"{nm}: {val} {unit} is above reference {(rl)}–{(rh)} {unit}.".strip())
        elif flag == "low":
            lines.append(f"{nm}: {val} {unit} is below reference {(rl)}–{(rh)} {unit}.".strip())
    if not lines:
        return ""
    disclaimer = (
        "This is extracted data compared to reference intervals stored in MedScan—not a diagnosis."
    )
    return "\n".join(lines) + "\n\n" + disclaimer


def lab_insights_plain_language(rows: list[dict[str, Any]]) -> str:
    if not rows:
        return ""

    fallback = _deterministic_lab_commentary(rows)
    if llm_is_configured():
        flagged = [r for r in rows if r.get("flag") != "normal"]
        if flagged:
            parts = []
            for r in flagged[:14]:
                parts.append(f'{r.get("name")}: {r.get("value")} ({r.get("flag")}).')
            msgs = [{"role": "user", "content": f"Brief neutral patient wording for labs: {'; '.join(parts)}"}]
            try:
                return chat_completion(msgs) or fallback
            except Exception:  # noqa: BLE001
                return fallback
        try:
            return chat_completion(
                [{"role": "user", "content": "Summarize that all listed markers are within reference (brief)."}]
            ) or fallback
        except Exception:  # noqa: BLE001
            return fallback
    return fallback


def ai_medicine_fallback_enabled() -> bool:
    flag = os.environ.get("MEDSCAN_AI_MEDICINE_FALLBACK", "1").strip().lower()
    return flag not in ("0", "false", "no", "off")


def _parse_json_array(raw: str) -> list[str]:
    text = (raw or "").strip()
    if not text:
        return []
    fence = re.search(r"```(?:json)?\s*([\s\S]*?)```", text)
    if fence:
        text = fence.group(1).strip()
    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        start = text.find("[")
        end = text.rfind("]")
        if start >= 0 and end > start:
            try:
                data = json.loads(text[start : end + 1])
            except json.JSONDecodeError:
                return []
        else:
            return []
    if not isinstance(data, list):
        return []
    out: list[str] = []
    for item in data:
        if isinstance(item, str) and item.strip():
            out.append(item.strip())
        elif isinstance(item, dict):
            name = (item.get("name") or item.get("medicine") or "").strip()
            if name:
                out.append(name)
    return out


def extract_medicine_names_from_ocr_text(
    ocr_text: str,
    *,
    candidates: list[str] | None = None,
) -> list[str]:
    """Extract or filter medicine names from noisy prescription OCR via Azure OpenAI."""
    if not llm_is_configured():
        return []
    snippet = (ocr_text or "").strip()[:6000]
    if not snippet:
        return []

    candidate_block = ""
    if candidates:
        cleaned = [c.strip() for c in candidates if isinstance(c, str) and c.strip()]
        if cleaned:
            candidate_block = (
                "\n\nAutomated scan candidates (may include junk — keep only real medicines):\n"
                + json.dumps(cleaned, ensure_ascii=False)
            )

    prompt = (
        "You filter medicine names from Indian prescription OCR text.\n"
        "Return a JSON array of strings with ONLY medicine/drug product names.\n"
        "Examples:\n"
        '- Single: ["Paracetamol", "Amoxicillin"]\n'
        '- Combination topical: ["Diclofenac Diethylamine + Linseed Oil + Methyl Salicylate + Menthol + Capsaicin Gel"]\n'
        "Strict rules:\n"
        "- For multi-ingredient gels/creams/ointments on ONE Rx line, return ONE combined string "
        "joined with ' + ' (include form like Gel at the end). Do NOT split into separate partial salts.\n"
        "- Include medicines from Rx lines (Tab/Cap/Syp/Inj/Gel) or clear drug + dose/frequency lines.\n"
        "- Exclude patient names, doctor names, hospital/clinic headers, dates, CR No/UHID, "
        "diagnoses, chief complaint, lab tests, addresses, and section titles.\n"
        "- Prefer generic salt names over brand names when both appear.\n"
        "- Do not invent medicines not supported by the OCR text.\n"
        "- If none found, return []."
        f"{candidate_block}\n\n"
        f"Prescription OCR text:\n{snippet}"
    )
    try:
        raw = chat_completion([{"role": "user", "content": prompt}])
        return _parse_json_array(raw)
    except Exception as exc:  # noqa: BLE001
        logger.warning("LLM medicine extraction failed: %s", exc)
        return []
