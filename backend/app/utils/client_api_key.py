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


def check_client_api_key() -> tuple[bool, str, int]:
    """
    When MEDSCAN_CLIENT_API_KEY(S) is set, require a matching X-Medscan-Api-Key header.
    Returns (allowed, error_message, http_status).
    """
    from flask import request

    if request.method == "OPTIONS":
        return True, "", 200
    if not request.path.startswith("/api"):
        return True, "", 200
    if _path_exempt(request.path):
        return True, "", 200

    valid = _parse_keys()
    if not valid:
        return True, "", 200

    provided = (request.headers.get(CLIENT_API_KEY_HEADER) or "").strip()
    if provided and provided in valid:
        return True, "", 200

    # Signed-in clients built without the key still pass, but only with a valid MedScan JWT.
    # An expired/invalid token gets 401 so clients run their normal refresh / re-login path.
    if not provided and (request.headers.get("Authorization") or "").startswith("Bearer "):
        from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request

        try:
            verify_jwt_in_request(optional=True)
        except Exception:
            return False, "Invalid or expired token", 401
        if get_jwt_identity() is not None:
            return True, "", 200

    if not provided:
        return False, "Client API key required. Set X-Medscan-Api-Key (mobile: MEDSCAN_API_KEY dart-define).", 403
    return False, "Invalid client API key.", 403
