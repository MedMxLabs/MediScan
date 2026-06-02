"""Optional client API key — identifies trusted apps (mobile/web), not end-user auth."""
from __future__ import annotations

import os
import secrets

# Mobile + web send this; users still authenticate with JWT after login.
CLIENT_API_KEY_HEADER = "X-Medscan-Api-Key"

# Paths under /api that do not require the client key (public auth + health).
_EXEMPT_PREFIXES = (
    "/api/health",
    "/api/auth/",
    "/api/buy",
)


def _parse_keys() -> frozenset[str]:
    raw = os.environ.get("MEDSCAN_CLIENT_API_KEYS") or os.environ.get("MEDSCAN_CLIENT_API_KEY") or ""
    keys = {k.strip() for k in raw.split(",") if k.strip()}
    return frozenset(keys)


def client_api_keys_configured() -> bool:
    return bool(_parse_keys())


def generate_client_api_key() -> str:
    return secrets.token_urlsafe(32)


def _path_exempt(path: str) -> bool:
    return any(path.startswith(p) for p in _EXEMPT_PREFIXES)


def check_client_api_key() -> tuple[bool, str]:
    """
    When MEDSCAN_CLIENT_API_KEY(S) is set, require a matching X-Medscan-Api-Key header.
    Returns (allowed, error_message).
    """
    from flask import request

    if request.method == "OPTIONS":
        return True, ""
    if not request.path.startswith("/api"):
        return True, ""
    if _path_exempt(request.path):
        return True, ""

    valid = _parse_keys()
    if not valid:
        return True, ""

    provided = (request.headers.get(CLIENT_API_KEY_HEADER) or "").strip()
    if provided and provided in valid:
        return True, ""

    auth_header = (request.headers.get("Authorization") or "").strip()
    if auth_header.startswith("Bearer ") and len(auth_header) > 20:
        return True, ""

    if not provided:
        return False, "Client API key required. Set X-Medscan-Api-Key (mobile: MEDSCAN_API_KEY dart-define)."
    return False, "Invalid client API key."
