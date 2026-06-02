"""Chatbot — Azure OpenAI with deterministic FAQ fallback."""
from __future__ import annotations

import logging

import requests

from app.services.ai_service import LLMConfigurationError, chat_completion, llm_is_configured

logger = logging.getLogger(__name__)

_FAQ_KEYWORDS: tuple[tuple[tuple[str, ...], str], ...] = (
    (
        ("price", "compare", "pharmacy"),
        "Use Search Medicine to compare live prices across pharmacies. Results come from real storefront pages at query time.",
    ),
    (
        ("reminder", "adherence"),
        "Add reminders under Reminders; log doses to track adherence on your dashboard.",
    ),
    (
        ("prescription", "ocr"),
        "Upload a prescription image or PDF under Upload Prescription — OCR extracts medicine lines without inventing drugs.",
    ),
    (
        ("lab", "report"),
        "Lab Report Analysis parses biomarkers from uploads and compares them to reference intervals stored in MedScan.",
    ),
)


def faq_fallback(message: str) -> str | None:
    low = message.lower()
    for keys, text in _FAQ_KEYWORDS:
        if any(k in low for k in keys):
            return text
    return None


def _llm_unavailable_message(exc: Exception | None = None) -> str:
    if isinstance(exc, requests.HTTPError) and exc.response is not None:
        code = exc.response.status_code
        if code == 429:
            return (
                "Azure OpenAI rate limit reached (429 Too Many Requests). "
                "Your deployment has a low tokens-per-minute quota — wait a minute and try again, "
                "or raise TPM in Azure Portal → medmxlabs-openai → gpt-4.1-mini deployment → Update."
            )
        if code in (401, 403):
            return (
                "Azure OpenAI rejected the API key (401/403). "
                "Check AZURE_OPENAI_API_KEY in backend/.env matches Key 1 from Azure Portal."
            )
        if code == 404:
            return (
                "Azure OpenAI deployment not found (404). "
                "Confirm AZURE_OPENAI_API_BASE uses your exact deployment name (gpt-4.1-mini)."
            )
        try:
            detail = exc.response.json().get("error", {}).get("message", "")
        except Exception:  # noqa: BLE001
            detail = ""
        if detail:
            return f"Azure OpenAI error ({code}): {detail}"
        return f"Azure OpenAI request failed (HTTP {code}). Try again in a moment."

    if not llm_is_configured():
        return (
            "MedScan assistant requires Azure OpenAI (AZURE_OPENAI_*). "
            "Until then, try Search Medicine or Upload Prescription for structured flows."
        )
    return "Azure OpenAI is temporarily unavailable. Please try again in a minute."


def complete_chat(messages: list[dict[str, str]], user_context: str | None = None) -> tuple[str, bool]:
    """
    Returns (reply_text, from_llm).
    """
    llm_error: Exception | None = None
    if llm_is_configured():
        try:
            return chat_completion(messages, user_context=user_context), True
        except LLMConfigurationError as exc:
            llm_error = exc
        except requests.RequestException as exc:
            llm_error = exc
            logger.warning("Azure OpenAI chat failed: %s", exc)
    last_user = ""
    for m in reversed(messages):
        if m.get("role") == "user":
            last_user = m.get("content") or ""
            break
    fb = faq_fallback(last_user)
    unavailable = _llm_unavailable_message(llm_error)
    if fb:
        return fb + f"\n\n({unavailable})", False
    return unavailable, False
