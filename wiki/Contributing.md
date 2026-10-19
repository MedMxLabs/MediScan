# Contributing

Full guide: [`CONTRIBUTING.md`](https://github.com/MedMxLabs/MediScan/blob/main/CONTRIBUTING.md).  
Code of Conduct: [`CODE_OF_CONDUCT.md`](https://github.com/MedMxLabs/MediScan/blob/main/CODE_OF_CONDUCT.md).

## Flow

1. Fork [MedMxLabs/MediScan](https://github.com/MedMxLabs/MediScan)
2. Branch from `main`: `feat/…`, `fix/…`, `docs/…`
3. Keep the diff small; match surrounding code
4. Run checks for what you touched
5. Open a PR (template fills the checklist)

By contributing, your work is licensed under **MIT** (same as the project).

## Where code goes

| Area | Path |
| --- | --- |
| API | `backend/app/` — thin routes, logic in `services/` |
| Web | `frontend/src/` — pages call `services/api.js` |
| Android | `mobile/lib/features/` |
| Docs | `docs/` |

## Important rules

- Never commit `.env`, `docs/API_KEYS.local.md`, or `key.properties`
- Don't reintroduce `/api/auth/login` — Auth is Supabase-only
- API contract changes (especially search `202`): ship **backend + web + APK** together
- Schema changes: model + `schema_patch.py` + Alembic revision

## Security

Private reports only — [`SECURITY.md`](https://github.com/MedMxLabs/MediScan/blob/main/SECURITY.md). No public exploit issues.
