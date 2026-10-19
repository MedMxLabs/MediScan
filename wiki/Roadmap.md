# Roadmap

MedScan is **in development**. This page tracks themes, not a hard schedule. Concrete work is in [Issues](https://github.com/MedMxLabs/MediScan/issues).

## Now / near term

- Stabilize **background scrape jobs** (`202` + poll) across web and Android
- Contributor experience: docs, good-first issues, wiki
- UX polish: upload dropzones, clearer pending states
- Safer ops: job failure messages, rate limits that work across workers

## Next

- Lazy-load auth on the web (lighter landing)
- Shared upload component (prescription + lab)
- CI: Supabase defines on release APK; E2E for search poll flow
- Scrape-job **dedupe** for concurrent identical queries

## Later / bigger bets

- Redis **worker queue** instead of in-process scrape threads
- Scraper resilience (per-pharmacy metrics, circuit breakers)
- Optional **FCM** push for reminders
- Stronger self-host story (compose profiles, `SKIP_PLAYWRIGHT` defaults)

## Not goals (for now)

- Replacing a clinician or giving medical advice
- Supporting every pharmacy in India on day one
- iOS / desktop as first-class targets (Android + web first)

## How to influence the roadmap

- Open a [feature request](https://github.com/MedMxLabs/MediScan/issues/new/choose)
- Comment on an existing issue with use-case detail
- Ship a small PR that unblocks others (docs count!)
