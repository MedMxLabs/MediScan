# Local development

Run the backend and web app on Windows/macOS, and optionally the Android app against them.

## Prerequisites

| Tool | Version | For |
| --- | --- | --- |
| Python | 3.11+ | Backend |
| Node | 20+ | Web |
| Flutter | 3.x (Dart 3.11) | Android app |
| Tesseract | any recent | Local OCR fallback (optional if Azure DI is set) |

## 1. Backend

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements-dev.txt
playwright install chromium          # or set SKIP_PLAYWRIGHT=1
copy .env.example .env               # then fill in what you need (see API_KEYS.md)
python run.py                        # http://127.0.0.1:5000
```

With nothing set, you get SQLite, no API-key check, and HTTP scrapers plus 1mg/Apollo if Chromium is installed. `python scripts/check_setup.py` tells you what's missing.

Sign-in needs Supabase (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_JWT_SECRET` or JWKS). See [SUPABASE_AUTH.md](SUPABASE_AUTH.md).

## 2. Web

```powershell
cd frontend
npm install
npm run dev                          # http://localhost:5173
```

The dev server proxies `/api` to `http://127.0.0.1:5000`, so leave `VITE_API_URL` empty. If the backend has `MEDSCAN_CLIENT_API_KEYS`, put one of them in `frontend/.env` as `VITE_MEDSCAN_API_KEY`.

## 3. Android (optional)

```powershell
cd mobile
flutter pub get
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:5000
```

`10.0.2.2` is the emulator's name for your PC. On a real phone, use your PC's LAN IP (`run.py` already listens on `0.0.0.0`). More in [mobile.md](mobile.md).

## Docker (both at once)

```powershell
docker compose up --build            # api :5000, web :5173
```

This uses SQLite in a volume. Set `SECRET_KEY` / `JWT_SECRET_KEY` in your shell for anything that isn't throwaway.

## Before you push

```powershell
cd backend;  .\venv\Scripts\python.exe -m pytest tests/ -q
cd frontend; npm run lint; npm run build
cd mobile;   flutter analyze; flutter test
```

CI deploys on push to `main` (see [azure-deployment.md](azure-deployment.md#step-10--cicd-with-github-actions)). Backend, web and APK should go out together when the API contract changes.

## Common snags

| Symptom | Fix |
| --- | --- |
| Search stuck on "pending" | Backend logs should show `scrape job … failed`. Usually the Chromium isn't installed: run `playwright install chromium` or set `SKIP_PLAYWRIGHT=1` |
| `403 Invalid client API key` | `VITE_MEDSCAN_API_KEY` / `MEDSCAN_API_KEY` doesn't match `MEDSCAN_CLIENT_API_KEYS` |
| `429` while testing | Lower the rate limit or set `MEDSCAN_DISABLE_RATE_LIMIT=1` locally |
| OCR returns nothing | Install Tesseract (or set `TESSERACT_CMD`), or configure Azure Document Intelligence |
| Google sign-in `deleted_client` | The OAuth client in Supabase was deleted. Create a new one. See [SUPABASE_AUTH.md](SUPABASE_AUTH.md) |
| Phone can't reach the API | Use the LAN IP, not `localhost`, and allow port 5000 through the Windows firewall |
