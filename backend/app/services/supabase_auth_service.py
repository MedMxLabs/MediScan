"""Verify Supabase Auth JWTs and map them to local User rows."""
from __future__ import annotations

import logging
import os
from functools import lru_cache
from typing import Any

import jwt
from jwt import PyJWKClient

from app.extensions import db
from app.models.user import User

logger = logging.getLogger(__name__)


class SupabaseAuthError(Exception):
    pass


def is_configured() -> bool:
    """True when SUPABASE_URL is set (tokens verified via JWT secret and/or JWKS)."""
    return bool(_project_url())


def _project_url() -> str:
    return os.environ.get("SUPABASE_URL", "").strip().rstrip("/")


def _jwt_secret() -> str:
    return os.environ.get("SUPABASE_JWT_SECRET", "").strip()


def _issuer() -> str | None:
    url = _project_url()
    return f"{url}/auth/v1" if url else None


def _decode_hs256(token: str, secret: str) -> dict[str, Any]:
    issuer = _issuer()
    kwargs: dict[str, Any] = {
        "algorithms": ["HS256"],
        "audience": "authenticated",
        "leeway": 30,
    }
    if issuer:
        kwargs["issuer"] = issuer
    return jwt.decode(token, secret, **kwargs)


@lru_cache(maxsize=4)
def _jwks_client(jwks_url: str) -> PyJWKClient:
    return PyJWKClient(jwks_url, cache_keys=True)


def _decode_jwks(token: str) -> dict[str, Any]:
    url = _project_url()
    if not url:
        raise SupabaseAuthError("SUPABASE_URL is not set")
    signing_key = _jwks_client(f"{url}/auth/v1/.well-known/jwks.json").get_signing_key_from_jwt(token)
    alg = getattr(signing_key, "algorithm_name", None) or signing_key._jwk_data.get("alg")  # noqa: SLF001
    algorithms = [alg] if alg else ["RS256", "ES256", "ES384", "EdDSA"]
    issuer = _issuer()
    kwargs: dict[str, Any] = {
        "algorithms": algorithms,
        "audience": "authenticated",
        "leeway": 30,
    }
    if issuer:
        kwargs["issuer"] = issuer
    return jwt.decode(token, signing_key.key, **kwargs)


def verify_access_token(token: str) -> dict[str, Any]:
    """Decode Supabase user access token (HS256 legacy secret and/or JWKS signing keys)."""
    if not token or not token.strip():
        raise SupabaseAuthError("access_token required")
    if not _project_url():
        raise SupabaseAuthError("SUPABASE_URL is not set on this server")

    raw = token.strip()
    secret = _jwt_secret()
    errors: list[str] = []

    if secret:
        try:
            return _decode_hs256(raw, secret)
        except jwt.PyJWTError as exc:
            logger.debug("Supabase HS256 verify failed: %s", exc)
            errors.append(f"HS256: {exc}")

    if not secret:
        try:
            return _decode_jwks(raw)
        except Exception as exc:  # noqa: BLE001
            logger.debug("Supabase JWKS verify failed: %s", exc)
            errors.append(f"JWKS: {exc}")
    elif _project_url():
        try:
            return _decode_jwks(raw)
        except Exception as exc:  # noqa: BLE001
            logger.debug("Supabase JWKS verify failed after HS256: %s", exc)
            errors.append(f"JWKS: {exc}")

    hint = (
        "Check backend/.env: SUPABASE_URL must match your project, and SUPABASE_JWT_SECRET must be "
        "the JWT Secret from Supabase Dashboard → Project Settings → API (not the anon key)."
    )
    raise SupabaseAuthError(f"Invalid or expired Supabase token. {hint}") from None


def _email_from_claims(claims: dict[str, Any]) -> str:
    email = (claims.get("email") or "").strip().lower()
    if email:
        return email
    meta = claims.get("user_metadata") or {}
    if isinstance(meta, dict):
        email = (meta.get("email") or "").strip().lower()
    return email


def get_or_create_user_from_claims(claims: dict[str, Any]) -> User:
    sub = (claims.get("sub") or "").strip()
    if not sub:
        raise SupabaseAuthError("Token missing subject (sub)")

    email = _email_from_claims(claims)
    u = User.query.filter_by(supabase_id=sub).first()
    if u:
        if email and u.email != email:
            other = User.query.filter_by(email=email).first()
            if other and other.id != u.id:
                raise SupabaseAuthError("Email already linked to another account")
            u.email = email
        meta = claims.get("user_metadata") or {}
        if isinstance(meta, dict):
            name = (meta.get("full_name") or meta.get("name") or "").strip()
            if name and not u.name:
                u.name = name
        db.session.commit()
        return u

    if email:
        u = User.query.filter_by(email=email).first()
        if u:
            if u.supabase_id and u.supabase_id != sub:
                raise SupabaseAuthError("Account already linked to another sign-in provider")
            u.supabase_id = sub
            db.session.commit()
            return u

    if not email:
        email = f"{sub}@users.supabase.local"

    u = User(email=email, supabase_id=sub, role="user")
    meta = claims.get("user_metadata") or {}
    if isinstance(meta, dict):
        name = (meta.get("full_name") or meta.get("name") or "").strip()
        if name:
            u.name = name
    db.session.add(u)
    db.session.commit()
    return u


def user_from_access_token(token: str) -> User:
    claims = verify_access_token(token)
    return get_or_create_user_from_claims(claims)
