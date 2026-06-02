"""Pytest bootstrap — load medscan/.env and backend/.env before tests."""
from load_env import load_app_env

load_app_env()

# Strip Supabase + API-key vars so tests run in basic JWT mode without external deps.
import os

for _k in (
    "SUPABASE_URL",
    "SUPABASE_ANON_KEY",
    "SUPABASE_JWT_SECRET",
    "MEDSCAN_CLIENT_API_KEYS",
    "MEDSCAN_CLIENT_API_KEY",
):
    os.environ.pop(_k, None)
