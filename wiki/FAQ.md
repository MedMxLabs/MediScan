# FAQ

## Is MedScan medical advice?

**No.** It is informational software only — not a medical device and not a substitute for a clinician. See [NOTICE](https://github.com/MedMxLabs/MediScan/blob/main/NOTICE).

## Can I scrape pharmacies in production?

Operators are responsible for third-party **terms of service** and local law. Prefer caching, avoid `refresh=1` hammering, and use `SKIP_PLAYWRIGHT=1` for light local/dev runs. The authors assume no liability for scraping.

## Where do secrets go?

Never in git. Use `.env` files (gitignored) and `docs/API_KEYS.local.md` (gitignored). Templates: `.env.example`, `docs/API_KEYS.local.md.example`. Guide: [`docs/API_KEYS.md`](https://github.com/MedMxLabs/MediScan/blob/main/docs/API_KEYS.md).

## Why does search return 202?

Fresh scrapes run in the **background** so they don't block gunicorn workers. Clients must poll the job, then re-request. Old clients that don't handle `202` need updating — ship API + web + APK together.

## Forks and Azure deploy workflows

`.github/workflows/deploy-*.yml` deploy **MedMx Labs** Azure on push to `main`. Your fork won't have those secrets — expected. Don't put real cloud keys in a public fork.

## How do I report a security issue?

**Not** as a public issue. Use a [private advisory](https://github.com/MedMxLabs/MediScan/security/advisories/new) — [`SECURITY.md`](https://github.com/MedMxLabs/MediScan/blob/main/SECURITY.md).

## Wiki vs `docs/`?

`docs/` in the repo is the source of truth (versioned with code). This wiki is a friendly index. Prefer editing `docs/` for technical detail.
