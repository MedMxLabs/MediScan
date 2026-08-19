"""MedMx help assistant — rule-based FAQ (no external LLM)."""
from __future__ import annotations

_FAQ_KEYWORDS: tuple[tuple[tuple[str, ...], str], ...] = (
    (
        ("price", "compare", "pharmacy", "cheaper", "mrp"),
        "Use Search Medicine to compare live prices across Indian pharmacies. "
        "Results come from real storefront pages at query time — verify pack size before buying.",
    ),
    (
        ("reminder", "adherence", "dose", "schedule"),
        "Add medicines under Reminders, then log doses to track adherence on your dashboard.",
    ),
    (
        ("prescription", "ocr", "upload", "scan"),
        "Open Upload Prescription and attach a photo or PDF. OCR extracts medicine lines; "
        "you can compare prices from the results.",
    ),
    (
        ("lab", "report", "biomarker", "blood", "hb", "creatinine"),
        "Use Lab Reports to upload a report. MedMx parses common markers and compares them "
        "to reference intervals — informational only, not a diagnosis.",
    ),
    (
        ("jan aushadhi", "pmbjp", "kendra"),
        "The Jan Aushadhi locator is coming soon. Check the sidebar for updates.",
    ),
    (
        ("login", "sign in", "account", "password"),
        "Sign in from the login page with email/password or Google. "
        "Use Profile & Settings to manage your account.",
    ),
    (
        ("side effect", "interaction", "safe", "dosage"),
        "MedMx does not provide clinical advice. For side effects or drug interactions, "
        "consult your doctor or pharmacist. Use Search Medicine to compare prices only.",
    ),
)

_DEFAULT_REPLY = (
    "I'm the MedMx help guide — ask about medicine search, prescription upload, reminders, "
    "or lab reports.\n\n"
    "Examples: “How do I compare prices?”, “Upload prescription”, “Track my doses”.\n\n"
    "Informational only — not a substitute for professional medical care."
)


def faq_fallback(message: str) -> str | None:
    low = message.lower()
    for keys, text in _FAQ_KEYWORDS:
        if any(k in low for k in keys):
            return text
    return None


def complete_chat(messages: list[dict[str, str]], user_context: str | None = None) -> tuple[str, bool]:
    """Returns (reply_text, from_llm). from_llm is always False."""
    del user_context  # reserved for future personalization without LLM
    last_user = ""
    for m in reversed(messages):
        if m.get("role") == "user":
            last_user = (m.get("content") or "").strip()
            break
    return faq_fallback(last_user) or _DEFAULT_REPLY, False
