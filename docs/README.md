# MedScan docs

Start with [architecture](architecture.md) if you're new. Everything else is reference.

| Doc | What's in it |
| --- | --- |
| [architecture.md](architecture.md) | How the pieces fit: clients, API, scrapers, OCR, DB, background jobs |
| [development.md](development.md) | Run everything locally, tests, lint, common breakages |
| [backend.md](backend.md) | Flask code layout, services, config knobs, DB + migrations, scheduler |
| [api-reference.md](api-reference.md) | Every `/api` route, params, auth, response shapes |
| [frontend.md](frontend.md) | React app layout, routing, data fetching, PWA, build |
| [mobile.md](mobile.md) | Flutter app layout, build flags, signing, translations |
| [API_KEYS.md](API_KEYS.md) | Secrets and env vars, where each one lives |
| [SUPABASE_AUTH.md](SUPABASE_AUTH.md) | Supabase Auth setup and the token exchange |
| [SUPABASE_WEB.md](SUPABASE_WEB.md) | Web-specific Supabase setup (redirect URLs, Google) |
| [azure-deployment.md](azure-deployment.md) | Full Azure walkthrough (App Service, SWA, ACR, Postgres) |
| [COST.md](COST.md) | Keep GitHub at **$0** (Free plan, public repos, manual deploys) |
| [GITHUB_ACTIONS.md](GITHUB_ACTIONS.md) | What each workflow does (CI free, deploys manual) |
| [changelog.md](changelog.md) | What changed in each big round of work + deploy notes |

GitHub Wiki (short contributor map; sync from repo `wiki/`): [MediScan wiki](https://github.com/MedMxLabs/MediScan/wiki).

Open source:

- [`CONTRIBUTING.md`](../CONTRIBUTING.md) — PR checks, conventions
- [`SECURITY.md`](../SECURITY.md) — vulnerability reporting
- [`CODE_OF_CONDUCT.md`](../CODE_OF_CONDUCT.md) — community standards
- [`LICENSE`](../LICENSE) / [`NOTICE`](../NOTICE) — MIT + disclaimers

Flutter has its own longer guide in [`mobile/README.md`](../mobile/README.md).
