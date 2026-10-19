# Getting started

Full detail: [`docs/development.md`](https://github.com/MedMxLabs/MediScan/blob/main/docs/development.md) and [`docs/API_KEYS.md`](https://github.com/MedMxLabs/MediScan/blob/main/docs/API_KEYS.md).

## Prerequisites

- Python **3.11+**
- Node **20+**
- Flutter **3.x** (only if you touch Android)
- Optional: Tesseract, Playwright Chromium (`playwright install chromium`)

## 1. API

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements-dev.txt
copy .env.example .env
python run.py
```

API: `http://127.0.0.1:5000` · health: `GET /health`

Sign-in needs Supabase env vars — see [`docs/SUPABASE_AUTH.md`](https://github.com/MedMxLabs/MediScan/blob/main/docs/SUPABASE_AUTH.md).

## 2. Web

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. Vite proxies `/api` to the backend.

## 3. Android (optional)

```powershell
cd mobile
flutter pub get
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:5000
```

## Before a PR

```powershell
cd backend;  .\venv\Scripts\python.exe -m pytest tests/ -q
cd frontend; npm run lint; npm run build
cd mobile;   flutter analyze; flutter test
```

## Docker

```powershell
docker compose up --build
```

## Common snags

| Symptom | Fix |
| --- | --- |
| Search stuck “pending” | `playwright install chromium` or `SKIP_PLAYWRIGHT=1` |
| `403 Invalid client API key` | Match `VITE_MEDSCAN_API_KEY` / `MEDSCAN_API_KEY` to `MEDSCAN_CLIENT_API_KEYS` |
| Google `deleted_client` | Recreate OAuth client in Google Cloud → Supabase |

More: [`docs/development.md`](https://github.com/MedMxLabs/MediScan/blob/main/docs/development.md#common-snags).
