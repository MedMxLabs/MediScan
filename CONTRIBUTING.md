# Contributing to MedScan

Thanks for helping. Keep changes small, match the code around you, and don't commit secrets.

By contributing, you agree that your contributions are licensed under the [MIT License](LICENSE) (same as the rest of the project). Please follow the [Code of Conduct](CODE_OF_CONDUCT.md).

Setup and common snags: [`docs/development.md`](docs/development.md). Full docs index: [`docs/README.md`](docs/README.md).

## Quick start

1. Fork [MedMxLabs/MediScan](https://github.com/MedMxLabs/MediScan), then get the API and web running (see development docs).
2. Create a branch from `main`: `feat/…`, `fix/…`, or `docs/…`.
3. Make the change. Prefer the fewest files that solve the problem.
4. Run the checks for what you touched (below).
5. Open a PR against `main` with a short "why" and how you tested it (use the PR template).

## What goes where

| Area | Path | Notes |
| --- | --- | --- |
| API | `backend/app/` | Routes stay thin; logic in `services/`; shared helpers in `utils/` |
| Web | `frontend/src/` | Pages call `services/api.js`, not axios directly |
| Android | `mobile/lib/` | Feature folders under `features/`; API in `core/api/` |
| Docs | `docs/` | Update the relevant guide when behaviour or env vars change |

Don't add a new dependency if the stdlib or an already-installed package covers it.

## Before you open a PR

Run only what applies:

```powershell
# Backend
cd backend
.\venv\Scripts\python.exe -m pytest tests/ -q

# Web
cd frontend
npm run lint
npm run build

# Mobile
cd mobile
flutter analyze
flutter test
```

Ship **backend + web + APK together** if you change the API contract (especially search/compare). Older clients don't handle `202` pending scrapes.

## Conventions

### Backend

- Responses use `ok()` / `err()` from `app/utils/responses.py` unless the route is documented as raw JSON (auth tokens, a few legacy shapes).
- Never return exception text in 500s.
- Schema changes: update the model **and** `schema_patch.py`, plus an idempotent Alembic revision. See [`docs/backend.md`](docs/backend.md).
- Scrapers live under `app/services/scraper_service/`. Don't hit live pharmacies in tests — monkeypatch `run_live_scrape`.
- Keep secrets in env / Azure settings. Never commit `.env`, `API_KEYS.local.md`, or `android/key.properties`.

### Frontend

- New pages: lazy route in `App.jsx`, API helper in `services/api.js`, nav link only if it belongs in the sidebar.
- Preserve the existing visual language; don't introduce a new design system for one screen.
- `VITE_*` values are public. No secrets in the frontend bundle.

### Mobile

- Use `--dart-define` for `API_BASE_URL` / `MEDSCAN_API_KEY` (and optional Supabase defines). See [`docs/mobile.md`](docs/mobile.md).
- After editing `lib/l10n/app_*.arb`, run `flutter gen-l10n` and commit the generated files.
- Android is the supported target. Don't break iOS/desktop folders casually, but you don't need to verify them.

### Auth

Web and mobile both use Supabase Auth, then `POST /api/auth/supabase` for MedScan JWTs. Don't reintroduce `/api/auth/login` or password-reset routes.

## Pull requests

- Title: short and specific (`fix: advance reminder next_trigger before notify`).
- Body: what changed, why, and a short test plan (commands you ran + manual checks).
- One concern per PR when you can. Docs-only and refactor-only PRs are fine.
- If the PR changes routes, update [`docs/api-reference.md`](docs/api-reference.md). Bigger behaviour shifts get a note in [`docs/changelog.md`](docs/changelog.md).

CI deploys `main` to Azure. Don't merge broken search/OCR/auth flows.

## Issues and ideas

- Prefer a clear bug report: steps, expected vs actual, platform (web / Android / API), and logs if you have them.
- For features, say the user problem first — not only the implementation.
- This is not medical advice. Don't contribute copy that tells people to skip a doctor or self-prescribe.

## Security

If you find a vulnerability (auth bypass, key leak, injection, etc.), **don't** open a public issue with exploit details. Follow [`SECURITY.md`](SECURITY.md) (private advisory or email).

## Forks and deploy workflows

`.github/workflows/deploy-*.yml` push to MedMx Labs Azure on `main`. Forks won't have those secrets — that's expected. Don't put real Azure / Supabase / API keys in your fork if it's public; use placeholders and local `.env` files only.
