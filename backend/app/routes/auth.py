"""Authentication — Supabase Auth + MedScan JWT exchange."""
from __future__ import annotations

import os

from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token, create_refresh_token, get_jwt_identity, jwt_required

from app.extensions import db
from app.models.user import User
from app.services.supabase_auth_service import SupabaseAuthError, is_configured as supabase_configured
from app.services.supabase_auth_service import user_from_access_token
from app.utils.user_data import delete_user_account

bp = Blueprint("auth", __name__, url_prefix="/api/auth")


def _token_response(u: User):
    uid = str(u.id)
    return jsonify(
        {
            "access_token": create_access_token(identity=uid),
            "refresh_token": create_refresh_token(identity=uid),
            "user": {"id": u.id, "email": u.email, "name": u.name or ""},
        }
    )


@bp.get("/supabase/config")
def supabase_config():
    """Public Supabase project URL + anon key for web/mobile SDKs."""
    url = os.environ.get("SUPABASE_URL", "").strip()
    anon = os.environ.get("SUPABASE_ANON_KEY", "").strip()
    if not url or not anon:
        return jsonify({"enabled": False})
    return jsonify({"enabled": True, "url": url, "anon_key": anon})


@bp.post("/supabase")
def supabase_exchange():
    """Exchange a Supabase Auth access_token for MedScan API JWTs."""
    if not supabase_configured():
        return jsonify({"error": "Supabase auth is not configured on this server"}), 503
    data = request.get_json(silent=True) or {}
    token = (data.get("access_token") or data.get("token") or "").strip()
    if not token:
        return jsonify({"error": "access_token required"}), 400
    try:
        u = user_from_access_token(token)
    except SupabaseAuthError as exc:
        return jsonify({"error": str(exc)}), 401
    return _token_response(u)


@bp.post("/logout")
@jwt_required()
def logout():
    return jsonify({"ok": True, "detail": "Client should discard tokens"})


@bp.post("/refresh")
@jwt_required(refresh=True)
def refresh():
    uid = get_jwt_identity()
    return jsonify({"access_token": create_access_token(identity=uid)})


@bp.delete("/account")
@jwt_required()
def delete_account():
    uid = int(get_jwt_identity())
    if not delete_user_account(uid):
        return jsonify({"error": "User not found"}), 404
    return jsonify({"ok": True, "message": "Account deleted"})
