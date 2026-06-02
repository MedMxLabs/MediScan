#!/usr/bin/env python3
"""Generate a MedScan client API key for mobile/web apps."""
from __future__ import annotations

import sys
from pathlib import Path

_BACKEND = Path(__file__).resolve().parent.parent
if str(_BACKEND) not in sys.path:
    sys.path.insert(0, str(_BACKEND))

from app.utils.client_api_key import CLIENT_API_KEY_HEADER, generate_client_api_key


def main() -> int:
    key = generate_client_api_key()
    print("Generated MedScan client API key (add to backend .env and mobile build):\n")
    print(f"MEDSCAN_CLIENT_API_KEYS={key}\n")
    print("Backend: restart Flask after saving to backend/.env")
    print("Azure:  az webapp config appsettings set -g rg-medscan -n medscan-api \\")
    print(f'          --settings MEDSCAN_CLIENT_API_KEYS="{key}"')
    print("\nMobile:")
    print(f'  flutter run --dart-define=MEDSCAN_API_KEY={key}')
    print("\nWeb (production build):")
    print(f'  VITE_MEDSCAN_API_KEY={key} npm run build')
    print(f"\nHTTP header on each request: {CLIENT_API_KEY_HEADER}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
