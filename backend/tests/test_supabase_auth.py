"""Supabase auth service."""
from __future__ import annotations

import jwt
import pytest

from app.services.supabase_auth_service import SupabaseAuthError, get_or_create_user_from_claims, verify_access_token


@pytest.fixture
def supabase_secret(monkeypatch):
    monkeypatch.setenv("SUPABASE_URL", "https://example.supabase.co")
    monkeypatch.setenv("SUPABASE_JWT_SECRET", "test-jwt-secret-for-unit-tests-only")


def _make_token(sub: str, email: str, secret: str) -> str:
    return jwt.encode(
        {
            "sub": sub,
            "email": email,
            "aud": "authenticated",
            "iss": "https://example.supabase.co/auth/v1",
        },
        secret,
        algorithm="HS256",
    )


def test_verify_access_token(supabase_secret):
    token = _make_token("uuid-1", "a@test.com", "test-jwt-secret-for-unit-tests-only")
    claims = verify_access_token(token)
    assert claims["sub"] == "uuid-1"
    assert claims["email"] == "a@test.com"


def test_verify_rejects_bad_token(supabase_secret):
    with pytest.raises(SupabaseAuthError):
        verify_access_token("not-a-jwt")


def test_get_or_create_user(supabase_secret):
    from app import create_app

    app = create_app()
    with app.app_context():
        from app.extensions import db

        u = get_or_create_user_from_claims({"sub": "uuid-2", "email": "b@test.com"})
        assert u.id
        assert u.supabase_id == "uuid-2"
        assert u.email == "b@test.com"
        again = get_or_create_user_from_claims({"sub": "uuid-2", "email": "b@test.com"})
        assert again.id == u.id
        db.session.rollback()
