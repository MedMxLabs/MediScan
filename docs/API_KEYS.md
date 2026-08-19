# MedScan — API keys & secrets reference

> **Security:** Never commit real keys to Git. Put actual values in **`docs/API_KEYS.local.md`** (gitignored) and in `.env` files (also gitignored).

## Quick links

| What you need | Where values live |
|---------------|-------------------|
| **Your private cheat sheet** | [`docs/API_KEYS.local.md`](./API_KEYS.local.md) — copy from [template](./API_KEYS.local.md.example) |
| Backend (Flask) | `medscan/backend/.env` or `medscan/.env` |
| Web app (Vite) | `medscan/frontend/.env` |
| Mobile (Flutter) | `--dart-define=...` at build/run time |
| Production API | Azure Portal → **medscan-api** → Configuration → Application settings |
| Production web | Azure Portal → **swa-medscan** → Configuration (optional) |
| CI/CD | GitHub → repo **Settings → Secrets / Variables** |

---

## All keys at a glance

### Supabase Auth (optional)

| Variable | Where | Purpose |
|----------|-------|---------|
| `SUPABASE_URL` | Backend + `VITE_SUPABASE_URL` + mobile `SUPABASE_URL` | Project URL |
| `SUPABASE_ANON_KEY` | Backend + `VITE_SUPABASE_ANON_KEY` + mobile `SUPABASE_ANON_KEY` | Public anon key (SDK) |
| `SUPABASE_JWT_SECRET` | **Backend only** | Verify Supabase JWTs at `/api/auth/supabase` |

Setup guide: [SUPABASE_AUTH.md](./SUPABASE_AUTH.md)

### App & auth (backend)

| Variable | Purpose | Generate / source |
|----------|---------|-------------------|
| `SECRET_KEY` | Flask session signing | `python -c "import secrets; print(secrets.token_hex(32))"` |
| `JWT_SECRET_KEY` | Access & refresh JWT signing | Same as above (32+ bytes) |
| `JWT_ACCESS_MINUTES` | Access token TTL | Default `15` |
| `JWT_REFRESH_DAYS` | Refresh token TTL | Default `7` |
| `MEDSCAN_CLIENT_API_KEYS` | Client app gate (`X-Medscan-Api-Key`) | `python scripts/generate_client_api_key.py` |

### Azure Document Intelligence (backend, optional)

| Variable | Purpose |
|----------|---------|
| `AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT` | Resource endpoint URL |
| `AZURE_DOCUMENT_INTELLIGENCE_KEY` | Resource key |
| `AZURE_DOCUMENT_INTELLIGENCE_MODEL` | e.g. `prebuilt-read` |
| `MEDSCAN_AZURE_OCR` | `1` to prefer Azure DI when configured |

### LLM medicine filter (backend, optional — messy OCR accuracy)

| Variable | Purpose |
|----------|---------|
| `MEDSCAN_LLM_MEDICINE_FILTER` | `1` to enable LLM extraction pass |
| `MEDSCAN_LLM_PROVIDER` | `deepseek`, `openai`, or `azure` |
| `MEDSCAN_LLM_MEDICINE_MODE` | `merge` (default), `llm_primary`, or `llm_only` |
| `DEEPSEEK_API_KEY` | DeepSeek API key |
| `DEEPSEEK_MODEL` | e.g. `deepseek-chat` |
| `OPENAI_API_KEY` | OpenAI API key |
| `AZURE_OPENAI_API_BASE` + `AZURE_OPENAI_API_KEY` | Azure OpenAI deployment |

OCR stays on Azure Document Intelligence (or Tesseract). LLM is **only** used to filter medicine names from OCR text.

### Frontend (Vite — baked into build)

| Variable | Purpose | Must match |
|----------|---------|------------|
| `VITE_API_URL` | Backend base URL | `https://medscan-api.azurewebsites.net` (prod) |
| `VITE_MEDSCAN_API_KEY` | Client API header | `MEDSCAN_CLIENT_API_KEYS` on backend |
| `VITE_OMNIDIMENSION_WIDGET_SECRET` | Floating chat widget | Omnidimension dashboard |

### Mobile (Flutter — `--dart-define`)

| Define | Purpose | Must match |
|--------|---------|------------|
| `API_BASE_URL` | Backend base URL | Production API URL |
| `MEDSCAN_API_KEY` | `X-Medscan-Api-Key` header | `MEDSCAN_CLIENT_API_KEYS` |
| `GOOGLE_CLIENT_ID` | Google sign-in (app) | `GOOGLE_OAUTH_CLIENT_ID` |

User login after client key: **JWT** in `Authorization: Bearer <access_token>` (web: via Supabase Auth + `/api/auth/supabase`; mobile: via `/api/auth/login`).

### Infrastructure & deploy (not in app runtime)

| Secret / setting | Used for |
|------------------|----------|
| `AZURE_CREDENTIALS` (GitHub) | Backend deploy workflow |
| `AZURE_SWA_DEPLOYMENT_TOKEN` (GitHub) | Frontend deploy to Static Web Apps |
| ACR admin password | Pull `acrmedscan.azurecr.io/medscan-api` on App Service |
| `DATABASE_URL` | PostgreSQL connection string (production) |
| `CORS_ORIGINS` | Allowed web origins (SWA URL) |
| `REDIS_URL` | Optional cache / queues |
| `MEDSCAN_SMTP_*` | Email reminders |
| `SCRAPER_PROXY_URL` | Optional pharmacy scrape proxy |

---

## HTTP headers

| Header | When |
|--------|------|
| `X-Medscan-Api-Key` | Required on most `/api/*` routes when `MEDSCAN_CLIENT_API_KEYS` is set |
| `Authorization: Bearer <jwt>` | Logged-in user routes |

Exempt from client key: `/api/health`, `/api/auth/*`.

---

## Production URLs (MedScan Azure)

| Service | URL |
|---------|-----|
| API | https://medscan-api.azurewebsites.net |
| Web | https://icy-pond-06a17d300.7.azurestaticapps.net |
| Resource group | `rg-medscan` |
| App Service | `medscan-api` |
| Static Web App | `swa-medscan` |
| Container registry | `acrmedscan.azurecr.io` |

---

## Setup commands

```powershell
# Generate client API key
cd medscan\backend
.\venv\Scripts\python.exe scripts\generate_client_api_key.py

# Check backend config (no secrets printed)
.\venv\Scripts\python.exe scripts\check_setup.py

# Mobile (production)
cd medscan\mobile
flutter run --dart-define=API_BASE_URL=https://medscan-api.azurewebsites.net --dart-define=MEDSCAN_API_KEY=<from API_KEYS.local.md>

# Web production build
cd medscan\frontend
$env:VITE_API_URL="https://medscan-api.azurewebsites.net"
$env:VITE_MEDSCAN_API_KEY="<from API_KEYS.local.md>"
npm run build
```

---

## Azure CLI — set backend app settings

```powershell
# Client API key
az webapp config appsettings set -g rg-medscan -n medscan-api --settings `
  MEDSCAN_CLIENT_API_KEYS="<your-client-key>"

# Option C — Azure OpenAI medicine filter (paste your key; do not commit)
az webapp config appsettings set -g rg-medscan -n medscan-api --settings `
  MEDSCAN_LLM_MEDICINE_FILTER=1 `
  MEDSCAN_LLM_PROVIDER=azure `
  MEDSCAN_LLM_MEDICINE_MODE=merge `
  AZURE_OPENAI_API_BASE="https://medmxlabs-openai.openai.azure.com/openai/deployments/gpt-4.1-mini" `
  AZURE_OPENAI_API_KEY="<your-azure-openai-key>" `
  AZURE_OPENAI_MODEL=gpt-4.1-mini `
  AZURE_OPENAI_API_VERSION=2024-08-01-preview
```

---

## File map

```
medscan/
├── .env                          # Root secrets (optional; backend loads this too)
├── backend/.env                  # Primary backend secrets
├── frontend/.env                 # Vite secrets (VITE_*)
├── docs/
│   ├── API_KEYS.md               # This file (safe to commit)
│   ├── API_KEYS.local.md         # YOUR values (gitignored)
│   └── API_KEYS.local.md.example # Template to copy
└── mobile/                       # No .env — use dart-define
```

See also: [azure-deployment.md](./azure-deployment.md).
