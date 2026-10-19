# Security Policy

## Supported versions

Security fixes go to the `main` branch of this repository. If you run a fork or an older deploy, please upgrade.

## Reporting a vulnerability

**Do not open a public GitHub issue for security problems.**

Open a private [GitHub security advisory](https://github.com/MedMxLabs/MediScan/security/advisories/new) on this repo. If you cannot use GitHub, contact the [MedMx Labs](https://github.com/MedMxLabs) org owners.

Include:

- A short description of the issue and its impact
- Steps to reproduce (PoC if you have one)
- Affected component (API, web, Android, docs, CI)
- Whether you plan to disclose publicly and on what timeline

We aim to acknowledge reports within **7 days** and to share a remediation plan or fix status within **30 days** when possible.

## Scope

In scope examples:

- Auth bypass, JWT misuse, API-key bypass
- Injection (SQL, command, XSS, SSRF)
- Secrets or PII leaking in responses, logs, or the public repo
- Privilege escalation between users

Out of scope / expected behaviour:

- Rate limits you can hit by design
- Scraping pharmacy sites (ToS / legal risk is on the operator — see the README disclaimer)
- Issues that only affect misconfigured self-hosted deploys with default secrets

## Secrets in this project

Never commit:

- `.env`, `backend/.env`, `frontend/.env`
- `docs/API_KEYS.local.md`
- `mobile/android/key.properties`, `*.jks` / `*.keystore`
- Real Supabase service-role keys, JWT secrets, SMTP passwords, Azure credentials

Use the `.env.example` files and [`docs/API_KEYS.md`](docs/API_KEYS.md). Client-facing values (`VITE_*`, Supabase anon key) are public by design — still don't put service-role or signing secrets in the frontend or mobile app.
