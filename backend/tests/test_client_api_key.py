"""Client API key middleware."""
from __future__ import annotations

import pytest
from flask_jwt_extended import create_access_token

from app.utils.client_api_key import CLIENT_API_KEY_HEADER

# Guarded, side-effect free route (search-medicine would start a live scrape).
GUARDED = "/api/medicine/1"


@pytest.fixture
def app_with_key(monkeypatch):
    monkeypatch.setenv("MEDSCAN_CLIENT_API_KEYS", "test-client-key-abc")
    from app import create_app

    return create_app("testing")


def test_health_without_key(app_with_key):
    client = app_with_key.test_client()
    r = client.get("/api/health")
    assert r.status_code == 200


def test_auth_routes_exempt_without_key(app_with_key):
    client = app_with_key.test_client()
    r = client.get("/api/auth/supabase/config")
    assert r.status_code != 403


def test_protected_route_rejects_missing_key(app_with_key):
    client = app_with_key.test_client()
    r = client.get("/api/search-medicine?query=para")
    assert r.status_code == 403
    body = r.get_json()
    assert body.get("status") == "error"


def test_protected_route_accepts_valid_key(app_with_key):
    client = app_with_key.test_client()
    r = client.get(GUARDED, headers={CLIENT_API_KEY_HEADER: "test-client-key-abc"})
    assert r.status_code == 200


def test_bogus_bearer_rejected_without_key(app_with_key):
    client = app_with_key.test_client()
    r = client.get(GUARDED, headers={"Authorization": "Bearer " + "x" * 40})
    assert r.status_code == 401


def test_valid_jwt_allowed_without_key(app_with_key):
    with app_with_key.app_context():
        token = create_access_token(identity="1")
    client = app_with_key.test_client()
    r = client.get(GUARDED, headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200


def test_no_keys_configured_allows_requests(monkeypatch):
    monkeypatch.delenv("MEDSCAN_CLIENT_API_KEYS", raising=False)
    monkeypatch.delenv("MEDSCAN_CLIENT_API_KEY", raising=False)
    from app import create_app

    app = create_app("testing")
    client = app.test_client()
    r = client.get(GUARDED)
    assert r.status_code == 200
