"""WSGI entrypoint for Gunicorn, uWSGI, and other production servers."""
from __future__ import annotations

from load_env import load_app_env

load_app_env()

from app import create_app

app = create_app()

# Many hosts (mod_wsgi, some PaaS templates) expect this name
application = app
