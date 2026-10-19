# Backend (Flask API)

Python 3.11, Flask app factory, SQLAlchemy, Flask-JWT-Extended, APScheduler. Runs under gunicorn in a Playwright Docker image with Tesseract.

## Layout

```
backend/
├── app/
│   ├── __init__.py          create_app(): config, CORS, API-key + rate-limit guards, blueprints,
│   │                        DB init (create_all + schema_patch + catalog seed), scheduler
│   ├── config.py            Dev / prod config from env
│   ├── extensions.py        db, jwt
│   ├── models/              SQLAlchemy models (one file per area)
│   ├── routes/              One blueprint per feature (thin: parse input, call a service, envelope)
│   ├── services/
│   │   ├── comparison_service.py     Search/compare: cache lookup, 202 + job, payload shaping
│   │   ├── scrape_job_service.py     Background scrape jobs (threads, DB state, stale detection)
│   │   ├── scraper_service/          Pharmacy scrapers
│   │   │   ├── common.py             Config, result shape, price/label parsing, JSON-LD parsing
│   │   │   ├── discovery.py          Product-URL lookup via Google / DuckDuckGo + seed cache
│   │   │   ├── http_sites.py         PharmEasy, Netmeds, TrueMeds, MedPlus (httpx)
│   │   │   ├── browser_sites.py      1mg, Apollo (Playwright)
│   │   │   └── runner.py             Runs all scrapers under one deadline → ScrapeOutcome
│   │   ├── medicine_extract_service/ Medicine names from OCR text
│   │   │   ├── patterns.py           Regexes + known combination recipes
│   │   │   ├── text.py               Line cleanup, junk filters
│   │   │   ├── catalog.py            Catalog seed lookup (precompiled patterns)
│   │   │   ├── combinations.py       Fixed-dose combos, de-dupe
│   │   │   └── extract.py            extract_medicine_names(), capability scan
│   │   ├── medicine_llm_filter.py    Optional LLM pass over extracted names
│   │   ├── llm_client.py             OpenAI / DeepSeek / Azure OpenAI JSON chat
│   │   ├── ocr_service.py            Pipeline: PDF text → Azure DI → local OCR
│   │   ├── ocr_engines.py            Tesseract, RapidOCR, OpenCV preprocessing, PDF extractors
│   │   ├── document_intelligence_service.py  Azure Document Intelligence client
│   │   ├── report_service.py / report_analysis_service.py  Lab biomarker parsing
│   │   ├── reminder_service.py       next_trigger maths, advance after a dose
│   │   ├── notification_service.py   SMTP email, SMS webhook
│   │   ├── recommendation_service.py Alternatives, pharmacy ranking, affordability
│   │   ├── supabase_auth_service.py  Verify Supabase JWTs, map to local users
│   │   └── chatbot_service.py        Rule-based FAQ bot
│   ├── scheduler/jobs.py    reminder_tick, cache_sweep, scraper_retry
│   ├── utils/
│   │   ├── responses.py     ok() / err() envelopes
│   │   ├── client_api_key.py X-Medscan-Api-Key guard
│   │   ├── rate_limit.py    In-memory per-IP limits
│   │   ├── redis_cache.py   Optional Redis (no-op without REDIS_URL)
│   │   ├── schema_patch.py  Idempotent column/index fixes at startup
│   │   ├── process_lock.py  fcntl locks: one DB init, one scheduler
│   │   └── …                validators, logger, user_data, upload_cleanup, catalog_seed
│   └── data/                medicine_catalog_seed.json, product_url_cache.json
├── migrations/              Alembic (001 initial, 002 supabase_id, 003 scrape_jobs + indexes)
├── scripts/                 check_setup.py, generate_client_api_key.py, sync_api_keys_doc.py
├── tests/                   pytest
├── Dockerfile
├── requirements.txt         Runtime deps
└── requirements-dev.txt     + pytest
```

Rule of thumb: routes stay thin, logic goes in `services/`, shared plumbing in `utils/`.

## Request pipeline

Every `/api` request goes through, in order:

1. **Client API key**: `X-Medscan-Api-Key` checked against `MEDSCAN_CLIENT_API_KEYS` (skipped when unset). Missing or wrong key → 403. A valid MedScan JWT also passes; an invalid one gets 401.
2. **Rate limit**: 30/min per IP (`MEDSCAN_RATE_LIMIT_PER_MIN`); search/compare also 8/min (`MEDSCAN_SCRAPE_RATE_LIMIT_PER_MIN`).
3. **JWT** where the route asks for it (`@jwt_required()` or `optional=True`).
4. The route. Errors become `{"status":"error","message":…}`. 500s never include exception text.

## Configuration

Secrets (keys, DB URL, Supabase, LLM, Azure DI) are in [API_KEYS.md](API_KEYS.md). These are the tuning knobs:

| Variable | Default | What |
| --- | --- | --- |
| `FLASK_ENV` | `development` | `production` refuses to start with the default dev secret key |
| `DATABASE_URL` | `sqlite:///medscan.db` | `postgres://` is rewritten to `postgresql://` |
| `CORS_ORIGINS` | localhost dev ports | Comma-separated web origins |
| `LOG_LEVEL` | `INFO` | |
| `MEDSCAN_UPLOAD_FOLDER` | `<repo>/uploads` | Docker sets `/app/uploads` |
| `REDIS_URL` | empty | Optional extra cache layer |
| `MEDSCAN_CACHE_TTL_SECONDS` | `86400` | Redis TTL |
| `SCRAPER_TIMEOUT_SECS` | `120` | Overall scrape deadline |
| `SCRAPER_CONCURRENCY` | `6` | Playwright pages at once inside one scrape |
| `SCRAPER_MAX_CONCURRENT_JOBS` | `2` | Background scrapes at once per worker |
| `SCRAPER_PROXY_URL` | empty | Proxy for PharmEasy + Playwright |
| `SKIP_PLAYWRIGHT` | off | `1` skips 1mg/Apollo (no Chromium needed) |
| `PLAYWRIGHT_HEADED` | off | `1` shows the browser (local debugging) |
| `MEDSCAN_RATE_LIMIT_PER_MIN` | `30` | |
| `MEDSCAN_SCRAPE_RATE_LIMIT_PER_MIN` | `8` | |
| `MEDSCAN_DISABLE_RATE_LIMIT` | off | Tests set this |
| `MEDSCAN_DISABLE_SCHEDULER` | off | Tests set this |
| `MEDSCAN_OCR_MIN_CHARS` | `12` | Below this, OCR output counts as empty |
| `MEDSCAN_OCR_AZURE_ONLY` | off | Fail instead of falling back to local OCR |
| `TESSERACT_CMD` / `TESSERACT_LANG` | PATH / `eng` | |
| `MEDSCAN_SMTP_HOST/PORT/USER/PASSWORD/FROM/TLS` | unset | Reminder emails |
| `MEDSCAN_SMS_WEBHOOK_URL` | unset | Reminder SMS (otherwise logged) |
| `JWT_ACCESS_MINUTES` / `JWT_REFRESH_DAYS` | `15` / `7` | |

Run `python scripts/check_setup.py` to see what's configured (prints no secrets).

## Database and migrations

Production Postgres was created with `db.create_all()` and has **no `alembic_version` table**. So there are two mechanisms:

- **At startup** (every worker, serialised by a file lock): `create_all()` makes missing tables, then `schema_patch.patch_schema()` adds missing columns and indexes with `IF NOT EXISTS`, then the medicine catalog is seeded if empty. This keeps prod in sync without running Alembic.
- **Alembic** in `migrations/` mirrors the same changes for fresh, migration-managed DBs.

Adding a schema change:

1. Change the model.
2. If it's a new **column or index** on an existing table, add it to `schema_patch.py` (`INDEXES`, or the column lists).
3. Add an Alembic revision that's idempotent (check `inspect()` before creating), like `003_scrape_jobs_and_indexes.py`.

To bring prod's Alembic history in line once: `alembic stamp 003_scrape_jobs` (after the release is deployed).

## Background work

**Scrape jobs** (`scrape_job_service.py`) are daemon threads, not a queue. That's fine at this size because results and state are in Postgres, so a worker restart only loses in-flight jobs, which get reported as failed once stale. If you outgrow it, move `_run_job` to a real worker (RQ/Celery on the Redis that's already supported). Nothing else needs to change.

**Scheduler** (`scheduler/jobs.py`) runs in exactly one gunicorn worker (`hold_for_process_lifetime("scheduler")`). On Windows the locks are no-ops, which is fine for `python run.py`.

## Tests

```powershell
cd backend
.\venv\Scripts\python.exe -m pip install -r requirements-dev.txt
.\venv\Scripts\python.exe -m pytest tests/ -q
```

48 tests, about 10 seconds. Each test gets a fresh temp SQLite DB. Scrapers are never hit for real: tests monkeypatch `scrape_job_service.run_live_scrape`.

| File | Covers |
| --- | --- |
| `test_core.py` | Health, background search flow, reminders tick, account delete, catalog, history, dashboard, buy redirect |
| `test_client_api_key.py` | API key guard, JWT fallback, bogus Bearer → 401 |
| `test_ocr.py` | OCR pipeline, PDF text, medicine extraction, combos, LLM filter |
| `test_supabase_auth.py` | Supabase token verification and user mapping |

## Docker

`backend/Dockerfile` is based on `mcr.microsoft.com/playwright/python` (Chromium included) plus Tesseract. CMD:

```
gunicorn -w 2 --threads 4 -t 180 -b 0.0.0.0:$PORT wsgi:app
```

Threads keep the quick poll requests flowing while other requests are busy with OCR.
