"""Load environment from medscan/.env then backend/.env (backend wins on conflicts).

Kept outside the app/ package so importing this does not execute app/__init__.py
before DATABASE_URL and other vars are applied.
"""
from __future__ import annotations

from pathlib import Path

from dotenv import load_dotenv

_BACKEND_DIR = Path(__file__).resolve().parent
_ROOT_DIR = _BACKEND_DIR.parent


def load_app_env() -> None:
    load_dotenv(_ROOT_DIR / ".env", override=False)
    load_dotenv(_BACKEND_DIR / ".env", override=True)
