# MedScan wiki

**MedScan** (MedMx Labs) — medicine price comparison, prescription / lab OCR, reminders, and adherence for India.

> **Canonical docs live in the repo** under [`docs/`](https://github.com/MedMxLabs/MediScan/tree/main/docs). This wiki is a short map for contributors and self-hosters. When docs and wiki disagree, trust the repo.

| | |
| --- | --- |
| **Status** | In active development — APIs and UI can change |
| **License** | [MIT](https://github.com/MedMxLabs/MediScan/blob/main/LICENSE) |
| **Live web** | https://icy-pond-06a17d300.7.azurestaticapps.net |
| **API** | https://medscan-api.azurewebsites.net |
| **Org** | [MedMxLabs](https://github.com/MedMxLabs) |

Not medical advice. See [NOTICE](https://github.com/MedMxLabs/MediScan/blob/main/NOTICE).

## Start here

| I want to… | Go to |
| --- | --- |
| Run it locally | [Getting started](Getting-Started) → full guide in [`docs/development.md`](https://github.com/MedMxLabs/MediScan/blob/main/docs/development.md) |
| Understand the system | [`docs/architecture.md`](https://github.com/MedMxLabs/MediScan/blob/main/docs/architecture.md) |
| Contribute a PR | [Contributing](Contributing) → [`CONTRIBUTING.md`](https://github.com/MedMxLabs/MediScan/blob/main/CONTRIBUTING.md) |
| Pick an issue | [Good first issues](Good-First-Issues) · [Roadmap](Roadmap) |
| Call the API | [`docs/api-reference.md`](https://github.com/MedMxLabs/MediScan/blob/main/docs/api-reference.md) |
| Deploy on Azure | [`docs/azure-deployment.md`](https://github.com/MedMxLabs/MediScan/blob/main/docs/azure-deployment.md) |
| Report a vulnerability | [`SECURITY.md`](https://github.com/MedMxLabs/MediScan/blob/main/SECURITY.md) |

## Wiki pages

- [[Getting-Started]] — clone, run API + web (+ optional Android)
- [[Contributing]] — PR checklist and conventions
- [[Roadmap]] — where we're headed
- [[Good-First-Issues]] — labelled starter work
- [[Architecture-Overview]] — one-page system sketch
- [[FAQ]] — ToS, medical disclaimer, secrets, forks

## Stack (one glance)

- **API:** Python 3.11, Flask, SQLAlchemy, Playwright + httpx scrapers, Tesseract / Azure DI OCR  
- **Web:** React, Vite, Tailwind, PWA  
- **Mobile:** Flutter (Android)  
- **Auth:** Supabase → MedScan JWT exchange  
- **Cloud:** Azure App Service, Static Web Apps, ACR, Postgres (Microsoft for Startups)
