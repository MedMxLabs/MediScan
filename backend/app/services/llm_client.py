"""Minimal OpenAI-compatible chat client (OpenAI, DeepSeek, Azure OpenAI)."""
from __future__ import annotations

import json
import logging
import os
from dataclasses import dataclass

import requests

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class LlmConfig:
    provider: str
    url: str
    headers: dict[str, str]
    model: str


def _enabled() -> bool:
    flag = os.environ.get("MEDSCAN_LLM_MEDICINE_FILTER", "0").strip().lower()
    return flag in ("1", "true", "yes", "on")


def resolve_llm_config() -> LlmConfig | None:
    if not _enabled():
        return None

    provider = os.environ.get("MEDSCAN_LLM_PROVIDER", "").strip().lower()

    azure_key = os.environ.get("AZURE_OPENAI_API_KEY", "").strip()
    azure_base = os.environ.get("AZURE_OPENAI_API_BASE", "").strip().rstrip("/")
    if provider == "azure" or (not provider and azure_key and azure_base):
        if not azure_key or not azure_base:
            return None
        version = os.environ.get("AZURE_OPENAI_API_VERSION", "2024-08-01-preview").strip()
        model = os.environ.get("AZURE_OPENAI_MODEL", "").strip() or "gpt-4o-mini"
        url = f"{azure_base}/chat/completions?api-version={version}"
        return LlmConfig(
            provider="azure",
            url=url,
            headers={"api-key": azure_key, "Content-Type": "application/json"},
            model=model,
        )

    deepseek_key = os.environ.get("DEEPSEEK_API_KEY", "").strip()
    if provider == "deepseek" or (not provider and deepseek_key):
        if not deepseek_key:
            return None
        base = os.environ.get("DEEPSEEK_API_BASE", "https://api.deepseek.com").strip().rstrip("/")
        model = os.environ.get("DEEPSEEK_MODEL", "deepseek-chat").strip()
        url = f"{base}/chat/completions"
        return LlmConfig(
            provider="deepseek",
            url=url,
            headers={"Authorization": f"Bearer {deepseek_key}", "Content-Type": "application/json"},
            model=model,
        )

    openai_key = os.environ.get("OPENAI_API_KEY", "").strip()
    if provider == "openai" or openai_key:
        if not openai_key:
            return None
        base = os.environ.get("OPENAI_API_BASE", "https://api.openai.com/v1").strip().rstrip("/")
        model = os.environ.get("OPENAI_MODEL", "gpt-4o-mini").strip()
        url = f"{base}/chat/completions"
        return LlmConfig(
            provider="openai",
            url=url,
            headers={"Authorization": f"Bearer {openai_key}", "Content-Type": "application/json"},
            model=model,
        )

    return None


def is_llm_configured() -> bool:
    return resolve_llm_config() is not None


def scan_llm_capability() -> dict[str, bool | str]:
    cfg = resolve_llm_config()
    return {
        "llm_medicine_filter": cfg is not None,
        "llm_provider": cfg.provider if cfg else "",
        "llm_model": cfg.model if cfg else "",
    }


def chat_json(system: str, user: str, *, timeout: float = 45.0) -> dict | None:
    """Return parsed JSON object from model response, or None on failure."""
    cfg = resolve_llm_config()
    if not cfg:
        return None

    body = {
        "model": cfg.model,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        "temperature": 0,
        "response_format": {"type": "json_object"},
    }

    try:
        resp = requests.post(cfg.url, headers=cfg.headers, json=body, timeout=timeout)
        resp.raise_for_status()
        data = resp.json()
        content = (
            (data.get("choices") or [{}])[0]
            .get("message", {})
            .get("content", "")
        )
        if not content:
            return None
        parsed = json.loads(content)
        return parsed if isinstance(parsed, dict) else None
    except (requests.RequestException, json.JSONDecodeError, KeyError, IndexError) as exc:
        logger.warning("LLM chat_json failed (%s): %s", cfg.provider, exc)
        return None
