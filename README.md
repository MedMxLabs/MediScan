# MedScan (MedMx Labs)

Medicine price comparison, prescription / lab OCR, reminders, and adherence tracking for India.

Web + Flutter app, Flask API. Hosted on Azure. We're in **[Microsoft for Startups](https://www.microsoft.com/startups)** and use Azure credits from that program to run production.

Org: [github.com/MedMxLabs](https://github.com/MedMxLabs)

This is informational tooling only — not medical advice.

---

## Microsoft for Startups

MedMx Labs got into Microsoft for Startups so we can run MedScan on Azure without eating the whole cloud bill ourselves.

What we actually use:

- **App Service** — Flask API (Docker image with Playwright + Tesseract)
- **Static Web Apps** — React frontend
- **ACR** — container images
- **PostgreSQL Flexible Server** — main DB
- Optional: Redis, Document Intelligence, Azure OpenAI

Apply here if you're in the same boat: https://startups.microsoft.com

Cost / SKU notes and how long credits last are in [`docs/azure-deployment.md`](docs/azure-deployment.md).

### Live

- Web: https://icy-pond-06a17d300.7.azurestaticapps.net
- API: https://medscan-api.azurewebsites.net
- Android APK: https://icy-pond-06a17d300.7.azurestaticapps.net/downloads/medmx-android.apk

---

## What it does

- Search a medicine and compare prices across Indian online pharmacies (live scrape, not fake numbers)
- Upload a prescription (image/PDF) → OCR → pull out medicine names
- Upload a lab report → biomarker vs reference ranges
- Suggest Jan Aushadhi / generic alternatives when we can match the catalog
- Reminders + dose logging / adherence
- Dashboard, history, nearby pharmacies, simple FAQ chatbot
- Web (React) and mobile (Flutter)
- Auth via Supabase; API uses JWT after exchange

---

## Repo layout

```
backend/     Flask API, scrapers, OCR, reminders
frontend/    React + Vite + Tailwind
mobile/      Flutter app (see mobile/README.md)
docs/        Azure, API keys, Supabase
.github/     deploy workflows
```

---

## Stack

| Bit | Stuff we use |
| --- | --- |
| API | Python 3.11, Flask, SQLAlchemy, Playwright, HTTPX |
| OCR | OpenCV, Tesseract, RapidOCR, PyMuPDF |
| Auth | Supabase + JWT |
| Web | React, Vite, Tailwind |
| Mobile | Flutter |
| Cloud | Azure App Service, SWA, ACR, Postgres |

---

## Run locally

You need Python 3.11+, Node 20+, Flutter if you're doing mobile, Tesseract on PATH, and Chromium for Playwright.

**API**

```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate
pip install -r requirements.txt
python -m playwright install chromium
# copy .env.example → .env (see docs/API_KEYS.md)
python run.py
```

**Web**

```bash
cd frontend
npm install
npm run dev
```

Vite proxies `/api` to the backend.

**Mobile**

```bash
cd mobile
flutter pub get
flutter run --dart-define=API_BASE_URL=https://medscan-api.azurewebsites.net
```

Emulator to local API: leave default (`http://10.0.2.2:5000`) or pass your machine IP.

**Docker**

```bash
docker compose up --build
```

---

## Deploy (Azure)

Same stack we run with Microsoft for Startups credits.

```bash
cd backend
az acr build --registry acrmedscan --image medscan-api:latest --file Dockerfile .

cd ../frontend
npm run build
swa deploy ./dist --env production
```

Workflows under `.github/workflows/`. Full walkthrough: [`docs/azure-deployment.md`](docs/azure-deployment.md).

---

## Useful API routes

| Route | What |
| --- | --- |
| `GET /health` | alive? |
| `POST /api/auth/supabase` | Supabase token → our JWT |
| `GET /api/search-medicine` | price search |
| `GET /api/compare` | search + ranking |
| `POST /api/upload-prescription` | OCR Rx |
| `POST /api/report-analysis` | lab report |
| `GET/POST /api/reminders` | reminders |
| `GET/POST /api/adherence` | doses |
| `POST /api/chatbot` | FAQ bot |
| `GET /api/dashboard` | dashboard |
| `GET /api/pharmacies/nearby` | nearby shops |

Protected routes need a Bearer token. Prod may also want `X-Medscan-Api-Key` on some calls.

---

## Docs

- [`docs/azure-deployment.md`](docs/azure-deployment.md) — Azure + startup credits
- [`docs/API_KEYS.md`](docs/API_KEYS.md) — env vars
- [`docs/SUPABASE_AUTH.md`](docs/SUPABASE_AUTH.md) — auth
- [`mobile/README.md`](mobile/README.md) — Flutter

---

## Disclaimer

Not medical advice. Don't use this instead of a doctor.

Scraping pharmacy sites can break their ToS / local rules — check before you run scrapers in production.
