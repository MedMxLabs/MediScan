# Architecture overview

Full diagrams and data model: [`docs/architecture.md`](https://github.com/MedMxLabs/MediScan/blob/main/docs/architecture.md).

```text
[ Web (React/PWA) ]──┐
[ Android (Flutter) ]──┼──► Flask API ──► Postgres
                       │         │
                       │         ├── scrapers (httpx + Playwright)
                       │         ├── OCR (Azure DI / Tesseract)
                       │         └── scheduler (reminders, cache sweep)
                       │
                       └── Supabase Auth ──► POST /api/auth/supabase ──► MedScan JWT
```

## Search flow (important)

1. Client calls `GET /api/search-medicine` (or compare / alternatives)
2. **Cache hit** → `200` with prices  
3. **Cache miss** → `202` `{ pending, job_id, poll_after_ms }`  
4. Client polls `GET /api/scrape-jobs/<id>` until `done` / `failed`  
5. Client retries the original search (no `refresh`) for the payload  

Web: `getScraped` in `frontend/src/services/api.js`  
Mobile: `_getScraped` in `mobile/lib/core/api/medscan_api.dart`

## Auth

Clients never send Supabase tokens to business routes. They exchange once for MedScan JWTs, then use `Authorization: Bearer …`. Production may also require `X-Medscan-Api-Key`.

## Dig deeper

- Backend layout: [`docs/backend.md`](https://github.com/MedMxLabs/MediScan/blob/main/docs/backend.md)
- API routes: [`docs/api-reference.md`](https://github.com/MedMxLabs/MediScan/blob/main/docs/api-reference.md)
- Frontend: [`docs/frontend.md`](https://github.com/MedMxLabs/MediScan/blob/main/docs/frontend.md)
- Mobile: [`docs/mobile.md`](https://github.com/MedMxLabs/MediScan/blob/main/docs/mobile.md)
