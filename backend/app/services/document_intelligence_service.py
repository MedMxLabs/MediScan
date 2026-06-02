"""Azure Document Intelligence (prebuilt-read) — cloud OCR for scans and photos."""
from __future__ import annotations

import logging
import os
import time
from dataclasses import dataclass

import requests

logger = logging.getLogger(__name__)

_API_VERSION = os.environ.get("AZURE_DOCUMENT_INTELLIGENCE_API_VERSION", "2024-11-30")
_MODEL_ID = os.environ.get("AZURE_DOCUMENT_INTELLIGENCE_MODEL", "prebuilt-read")
_POLL_INTERVAL = float(os.environ.get("AZURE_DOCUMENT_INTELLIGENCE_POLL_SEC", "1.0"))
_POLL_TIMEOUT = float(os.environ.get("AZURE_DOCUMENT_INTELLIGENCE_TIMEOUT_SEC", "90"))


@dataclass
class AzureDiResult:
    text: str
    engine: str = "azure_document_intelligence"
    error: str | None = None


def _credentials() -> tuple[str, str]:
    endpoint = os.environ.get("AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT", "").strip().rstrip("/")
    key = os.environ.get("AZURE_DOCUMENT_INTELLIGENCE_KEY", "").strip()
    return endpoint, key


def is_available() -> bool:
    endpoint, key = _credentials()
    if not endpoint or not key:
        return False
    flag = os.environ.get("MEDSCAN_AZURE_OCR", "1").strip().lower()
    return flag not in ("0", "false", "no", "off")


def scan_capability() -> dict[str, bool | str]:
    endpoint, key = _credentials()
    return {
        "azure_document_intelligence": is_available(),
        "azure_di_configured": bool(endpoint and key),
        "azure_di_model": _MODEL_ID,
    }


def _guess_content_type(data: bytes, filename: str = "") -> str:
    fn = (filename or "").lower()
    if data[:4] == b"%PDF" or fn.endswith(".pdf"):
        return "application/pdf"
    if data[:8] == b"\x89PNG\r\n\x1a\n" or fn.endswith(".png"):
        return "image/png"
    if data[:2] == b"\xff\xd8" or fn.endswith((".jpg", ".jpeg")):
        return "image/jpeg"
    if data[:4] == b"RIFF" and len(data) > 12 and data[8:12] == b"WEBP":
        return "image/webp"
    if fn.endswith(".tif") or fn.endswith(".tiff"):
        return "image/tiff"
    return "application/octet-stream"


def analyze_document(data: bytes, filename: str = "") -> AzureDiResult:
    """Run Azure prebuilt-read on raw PDF/image bytes."""
    endpoint, key = _credentials()
    if not endpoint or not key:
        return AzureDiResult("", error="Azure Document Intelligence not configured")
    if not data:
        return AzureDiResult("", error="empty document")

    url = (
        f"{endpoint}/documentintelligence/documentModels/{_MODEL_ID}:analyze"
        f"?api-version={_API_VERSION}"
    )
    content_type = _guess_content_type(data, filename)
    headers = {
        "Ocp-Apim-Subscription-Key": key,
        "Content-Type": content_type,
    }

    try:
        start = requests.post(url, headers=headers, data=data, timeout=60)
        start.raise_for_status()
    except requests.RequestException as exc:
        logger.warning("Azure DI analyze request failed: %s", exc)
        return AzureDiResult("", error=f"Azure DI request failed: {exc}")

    operation_url = start.headers.get("Operation-Location") or start.headers.get("operation-location")
    if not operation_url:
        return AzureDiResult("", error="Azure DI did not return Operation-Location")

    deadline = time.monotonic() + _POLL_TIMEOUT
    while time.monotonic() < deadline:
        try:
            poll = requests.get(
                operation_url,
                headers={"Ocp-Apim-Subscription-Key": key},
                timeout=30,
            )
            poll.raise_for_status()
            body = poll.json()
        except requests.RequestException as exc:
            logger.warning("Azure DI poll failed: %s", exc)
            return AzureDiResult("", error=f"Azure DI poll failed: {exc}")

        status = (body.get("status") or "").lower()
        if status == "succeeded":
            analyze = body.get("analyzeResult") or {}
            content = (analyze.get("content") or "").strip()
            if content:
                return AzureDiResult(content)
            return AzureDiResult("", error="Azure DI returned empty content")
        if status in ("failed", "canceled"):
            err = body.get("error") or {}
            msg = err.get("message") if isinstance(err, dict) else str(err)
            return AzureDiResult("", error=f"Azure DI {status}: {msg or 'unknown error'}")
        time.sleep(_POLL_INTERVAL)

    return AzureDiResult("", error="Azure DI timed out waiting for analysis")
