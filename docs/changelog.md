# Changelog

## October 2026: open-source packaging

Added MIT `LICENSE`, `NOTICE`, `SECURITY.md`, `CODE_OF_CONDUCT.md`, GitHub issue/PR templates, Dependabot, and hardened `.gitignore`. Removed a project-specific Supabase host from public docs.

## October 2026: optimisation and restructure

Not deployed yet. Ship **backend, web and APK together**: older clients don't understand the new `202` search response.

### Breaking: searches run in the background

`/api/search-medicine`, `/api/compare` and `/api/alternatives` no longer hold the request open while scraping. On a cache miss they return `202` with a `job_id`, and clients poll `GET /api/scrape-jobs/<id>`. The web (`getScraped`) and mobile (`_getScraped`) clients handle this, so screens are unchanged. See [api-reference.md](api-reference.md#background-scrapes-202-flow).

Why: a scrape used to tie up one of only two gunicorn workers for up to two minutes, so two searches at once took the whole API down.

### Backend

- **Bugs**
  - The Playwright check always failed inside the event loop, so **1mg and Apollo never ran**. It now runs in a thread.
  - Due reminders never moved to the next dose, so they **re-fired every 15 minutes**. The tick now advances `next_trigger` and commits that before sending notifications, so a failed email can't undo it.
  - `/api/dashboard/compare-preview` passes the `202` through instead of reporting a fake failure.
- **Security**
  - 500s no longer leak exception text.
  - Any `Bearer …` header used to skip the API-key check. Now only a valid JWT does, and a bogus one gets 401.
  - Production refuses to start with the default dev `SECRET_KEY` / `JWT_SECRET_KEY`.
  - Supabase JWKS client is cached.
- **Performance**
  - DB indexes on hot lookups: `user_id` on history, prescriptions, lab reports, reminders and adherence; due-reminder scan; search-cache lookup.
  - Precompiled catalog regexes.
  - Batched user lookups in the reminder tick.
  - gunicorn now runs 4 threads per worker.
- **Scheduler**
  - Runs in exactly one worker (file lock).
  - New `cache_sweep` deletes search cache older than 30 days and scrape jobs older than 1 day.
- **Structure**
  - `scraper_service.py` and `medicine_extract_service.py` are split into packages.
  - Alternatives logic merged into `recommendation_service.find_alternatives`.
  - Dead code removed: `nlp_service`, the legacy `/medicine/search`, the `price_cache` table.
- **DB**: new `scrape_jobs` table. Alembic `003_scrape_jobs` also drops `price_cache`. `schema_patch` applies the same changes at startup.
- **Deps**: pytest moved to `requirements-dev.txt`.
- **Tests**: 48 pass. Added background-search and reminder-tick tests; removed always-skipped legacy tests.

### Web

- Lazy routes and stable vendor chunk groups (`vendor`, `charts`, `motion`) for better caching.
- Lint is clean.
- Background-scrape polling added.
- Dead files and the unused `_resolved*` Supabase cache removed.

### Mobile

- Background-scrape polling in `MedScanApi`.
- Release signing via `android/key.properties`.
- Fonts bundled, so they work offline.
- Removed unused imports and the stray empty folder under `lib/`, and regenerated l10n.
- `flutter analyze` is clean.

### Repo

- Removed unused files, build output and stale docs (`integration-report.md`).
- New docs: [architecture](architecture.md), [development](development.md), [api-reference](api-reference.md), [backend](backend.md), [frontend](frontend.md), [mobile](mobile.md).

### Deploy checklist

1. Deploy the backend. On startup it creates `scrape_jobs` and the new indexes by itself.
2. Optional, once: `alembic stamp 003_scrape_jobs` against prod so Alembic history matches.
3. Deploy the web app and publish the new APK straight after.
4. For Play Store builds, create `mobile/android/key.properties` first.
5. Smoke test: search a medicine you've never searched before. You should see "pending", then results within ~40 s.

### Known gaps

- The Supabase SDK still loads at web boot (could be lazy).
- The lab-report "drop it here" box looks like a drop target but only supports clicking to pick a file.
- CI builds the APK with only `API_BASE_URL` and `MEDSCAN_API_KEY`. That's fine, because the app fetches Supabase config from the backend.
