# MedScan (MedMx Labs)

**License:** [MIT](LICENSE) · **Status:** [in development](#status) · **PRs:** [welcome](CONTRIBUTING.md)

**MedMx Labs** is a company building healthcare tools for India. **MedScan** is our product — medicine price comparison, prescription / lab OCR, reminders, and adherence tracking.

We're still in **active development**. APIs, UI, and scrapers can change without notice. Expect rough edges.

Web + Flutter app, Flask API. Hosted on Azure. MedMx Labs is **backed by [Microsoft for Startups](https://www.microsoft.com/startups)** — we use Azure credits from that program to run staging / production.

Org: [github.com/MedMxLabs](https://github.com/MedMxLabs) · Repo: [MedMxLabs/MediScan](https://github.com/MedMxLabs/MediScan)

This is informational tooling only — not medical advice. See [NOTICE](NOTICE).

**Open source** under the [MIT License](LICENSE). Contributions welcome — start with [CONTRIBUTING.md](CONTRIBUTING.md) and the [Code of Conduct](CODE_OF_CONDUCT.md). Security reports: [SECURITY.md](SECURITY.md).

---

## Status

MedScan is a **work in progress**. Features land and get reworked as we figure out what sticks. Don't treat the live URLs as a finished product.

---

## Backed by Microsoft for Startups

MedMx Labs is backed by Microsoft for Startups. That gets us Azure credits and cloud runway so we can run MedScan without eating the whole bill ourselves.

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
docs/        architecture, API, per-app guides, Azure, keys, Supabase
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
| `GET /api/search-medicine` | price search (new medicine → `202`, poll the job) |
| `GET /api/scrape-jobs/<id>` | is that scrape done yet? |
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

Start at [`docs/README.md`](docs/README.md). Quick picks:

- [`docs/architecture.md`](docs/architecture.md) — how the pieces fit, diagrams
- [`docs/development.md`](docs/development.md) — run it locally, common snags
- [`docs/api-reference.md`](docs/api-reference.md) — every route
- [`docs/backend.md`](docs/backend.md) / [`frontend.md`](docs/frontend.md) / [`mobile.md`](docs/mobile.md) — per-app guides
- [`docs/azure-deployment.md`](docs/azure-deployment.md) — Azure + startup credits
- [`docs/API_KEYS.md`](docs/API_KEYS.md) — env vars
- [`docs/SUPABASE_AUTH.md`](docs/SUPABASE_AUTH.md) — auth
- [`docs/changelog.md`](docs/changelog.md) — what changed
- [`CONTRIBUTING.md`](CONTRIBUTING.md) — how to contribute
- [`SECURITY.md`](SECURITY.md) — vulnerability reporting
- [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md) — community standards
- [`LICENSE`](LICENSE) / [`NOTICE`](NOTICE) — MIT + medical / scraping disclaimer

---

## License

MIT — see [`LICENSE`](LICENSE). Third-party pharmacy sites and clinical use are your responsibility; see [`NOTICE`](NOTICE).

---

## Disclaimer

Not medical advice. Don't use this instead of a doctor.

Scraping pharmacy sites can break their ToS / local rules — check before you run scrapers in production.
