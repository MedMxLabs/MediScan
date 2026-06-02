"""Client API key middleware."""
from __future__ import annotations

import pytest

from app.utils.client_api_key import CLIENT_API_KEY_HEADER


@pytest.fixture
def app_with_key(monkeypatch):
    monkeypatch.setenv("MEDSCAN_CLIENT_API_KEYS", "test-client-key-abc")
    from app import create_app

    return create_app("testing")


def test_health_without_key(app_with_key):
    client = app_with_key.test_client()
    r = client.get("/api/health")
    assert r.status_code == 200


def test_auth_login_without_key(app_with_key):
    client = app_with_key.test_client()
    r = client.post("/api/auth/login", json={"email": "x@y.com", "password": "password123"})
    assert r.status_code in (400, 401, 404)


def test_protected_route_rejects_missing_key(app_with_key):
    client = app_with_key.test_client()
    r = client.get("/api/search-medicine?query=para")
    assert r.status_code == 403
    body = r.get_json()
    assert body.get("status") == "error"


def test_protected_route_accepts_valid_key(app_with_key):
    client = app_with_key.test_client()
    r = client.get(
        "/api/search-medicine?query=para",
        headers={CLIENT_API_KEY_HEADER: "test-client-key-abc"},
    )
    assert r.status_code != 403


def test_no_keys_configured_allows_requests(monkeypatch):
    monkeypatch.delenv("MEDSCAN_CLIENT_API_KEYS", raising=False)
    monkeypatch.delenv("MEDSCAN_CLIENT_API_KEY", raising=False)
    from app import create_app

    app = create_app("testing")
    client = app.test_client()
    r = client.get("/api/search-medicine?query=para")
    assert r.status_code != 403
