# API reference

Base URL: `https://medscan-api.azurewebsites.net` in production, `http://localhost:5000` locally (the Vite dev server proxies `/api`).

## Conventions

**Headers**

| Header | When |
| --- | --- |
| `Authorization: Bearer <access token>` | Routes marked 🔑. Optional on 🔓 routes (adds history, personalisation) |
| `X-Medscan-Api-Key: <key>` | All `/api` routes when the server sets `MEDSCAN_CLIENT_API_KEYS`, except `/api/health*`, `/api/auth/*`, `/api/buy`. A valid JWT also passes |

**Response envelope** (most routes)

```json
{ "status": "success", "message": "optional", "data": { } }
{ "status": "error", "message": "what went wrong", "code": "optional", "data": { } }
```

A few older routes return plain JSON with no envelope. Those are noted as *raw* below.

**Common errors**

| Status | Meaning |
| --- | --- |
| 400 | Missing / invalid input |
| 401 | Missing, expired or invalid JWT. Refresh and retry |
| 403 | Client API key missing or wrong |
| 404 | Not found, or not yours |
| 429 | Rate limited: 30 req/min per IP across `/api`, 8 live searches/min per IP |
| 502 | Every pharmacy scraper failed |
| 500 | Server bug (details are only in the server log) |

Rate limits are in-memory per worker, so the real ceiling is a bit higher with several workers.

---

## Health

| Route | Auth | Notes |
| --- | --- | --- |
| `GET /`, `GET /health`, `GET /api/health` | none | `{"status":"ok","service":"medscan-api"}`. Cheap, for load balancers |
| `GET /api/health/detail` | none | OCR and extraction capability scan. Slow-ish; don't use as a liveness probe |

## Auth `/api/auth`

| Route | Auth | Body / params | Returns |
| --- | --- | --- | --- |
| `GET /supabase/config` | none | | *raw* `{enabled, url, anon_key}`, the public Supabase settings for SDKs |
| `POST /supabase` | none | `{"access_token": "<supabase token>"}` | *raw* `{access_token, refresh_token, user}`. 401 if the token is bad, 503 if Supabase isn't configured |
| `POST /refresh` | refresh JWT | | *raw* `{access_token}` |
| `POST /logout` | 🔑 | | *raw* `{ok: true}`. Client just drops its tokens |
| `DELETE /account` | 🔑 | | Deletes the user and all their data |

## Medicine search and prices

| Route | Auth | Params | Returns |
| --- | --- | --- | --- |
| `GET /api/search-medicine` (alias `/api/search_medicine`) | 🔓 | `query` (or `q`), `refresh=1` to bypass cache | Prices, or **202 pending** (see below) |
| `GET /api/compare` | 🔓 | `medicine` (or `query`/`q`), `refresh=1` | Same as search plus `lowest_price`, `comparison_ranking`, `savings_percent_vs_lowest` per row |
| `GET /api/scrape-jobs/<job_id>` | 🔓 | | `{job_id, state, error, scrape_errors}`. `state` is `pending`, `running`, `done` or `failed`. 404 if unknown |
| `GET /api/alternatives` | 🔓 | `name` (or `query`) | `{query, seed, alternatives[]}`, catalog matches by composition, then generic name |
| `GET /api/medicine/<id>` | none | | *raw* catalog row |
| `GET /api/medicine/alternatives` | none | `id` or `name` | *raw* `{alternatives[]}` |
| `GET /api/buy` | 🔓 | `url` | 302 redirect to the pharmacy. Only whitelisted pharmacy hosts |

### The 202 flow

On a cache miss, search and compare start a background scrape and answer straight away:

```http
HTTP/1.1 202 Accepted

{"status":"success","data":{"pending":true,"job_id":"7c1e…","query":"dolo 650","poll_after_ms":2000}}
```

Client loop:

1. Wait `poll_after_ms`, then `GET /api/scrape-jobs/<job_id>`.
2. `done`: repeat the original request **without** `refresh=1`. It's now a cache hit.
3. `failed`: show `error` / `scrape_errors`.
4. Give up after ~180 s.

Both clients already do this (`getScraped` in `frontend/src/services/api.js`, `_getScraped` in `mobile/lib/core/api/medscan_api.dart`).

### Search payload

```json
{
  "query": "dolo 650",
  "medicine_display": "Dolo 650 Tablet",
  "prices": [
    {
      "pharmacy_name": "PharmEasy",
      "medicine_display": "Dolo 650 Tablet 15",
      "pack_size": "Strip of 15 tablets",
      "price": 30.9,
      "unit_price": 2.06,
      "discount": "",
      "availability": "See pharmacy site",
      "url": "https://pharmeasy.in/…",
      "scraped_at": "2026-10-19T06:46:21Z"
    }
  ],
  "scrape_errors": [{ "pharmacy": "Apollo Pharmacy", "error": "Timed out (120s)" }],
  "alternatives": [],
  "affordability": {},
  "scrape_timestamp": "2026-10-19T06:46:21Z",
  "cache_hit": true
}
```

`prices` is sorted cheapest first.

## Prescriptions and lab reports

Uploads are `multipart/form-data` with a `file` field: JPEG, PNG or PDF, 16 MB max.

| Route | Auth | Returns |
| --- | --- | --- |
| `POST /api/upload-prescription` (alias `/api/prescription/upload`) | 🔓 | OCR text, extracted medicines (singles and combinations with brand equivalents), engine used |
| `POST /api/report-analysis` (alias `/api/reports/upload`) | 🔑 | Parsed biomarkers with reference ranges and flags |
| `GET /api/reports` | 🔑 | Your lab reports |
| `GET /api/reports/<id>` | 🔑 | One report |

## Reminders and adherence

| Route | Auth | Body / params | Notes |
| --- | --- | --- | --- |
| `GET /api/reminders` | 🔑 | | Your reminders |
| `POST /api/reminders/create` (alias `POST /api/reminders`) | 🔑 | `medicine_name`, `dose`, `times` (`["09:00","21:00"]`), `frequency`, `duration_days`, `notes`, `start_date` | 201 with the reminder incl. `next_trigger` |
| `PATCH /api/reminders/update` | 🔑 | `id` + fields to change | |
| `DELETE /api/reminders/delete?id=` or `DELETE /api/reminders/<id>` | 🔑 | | |
| `POST /api/adherence/mark-dose` (alias `/api/adherence/log`) | 🔑 | `reminder_id`, `status` (`taken` default) | Logs the dose and moves `next_trigger` on |
| `GET /api/adherence` | 🔑 | | Logs + adherence % |
| `GET /api/adherence/report` | 🔑 | | *raw* `{logs[]}`, legacy flat list for older clients |
| `GET /api/refill/alerts` | 🔑 | | Active reminders whose course (`duration_days`) is about to run out |

## Dashboard, history, profile

| Route | Auth | Params | Notes |
| --- | --- | --- | --- |
| `GET /api/dashboard` | 🔑 | `refresh=1` | Stats, today's schedule, recent searches, `cheapest_picks`, adherence trend |
| `GET /api/dashboard/compare-preview` | 🔑 | | Prices for your last search. Can return **202 pending** like search |
| `GET /api/history` | 🔑 | `page`, `per_page` (≤100) | Searches, prescriptions, `lab_reports` |
| `GET /api/history/analytics` | 🔑 | | `totals`, `searches_per_day` |
| `GET /api/profile` | 🔑 | | Profile + preferences |
| `PATCH /api/profile/update` | 🔑 | `name`, `phone`, `date_of_birth`, `gender`, `notifications_enabled`, `email_digest`, `sms_alerts`, `theme` | |
| `POST /api/profile/reset-data` | 🔑 | | Wipes your activity, keeps the account |
| `GET /api/notifications` | 🔑 | `limit` (≤100) | In-app feed |
| `PATCH /api/notifications/<id>/read` | 🔑 | | |

## Other

| Route | Auth | Params | Notes |
| --- | --- | --- | --- |
| `GET /api/pharmacies/nearby` | 🔓 | `lat`, `lng`, `radius` (200 to 10000 m, default 2000) | Nearby pharmacies from OpenStreetMap Overpass, sorted by distance, with directions links. 502 if Overpass is down |
| `GET /api/jan-aushadhi/nearby` | 🔓 | `lat`, `lng`, `radius` (500 to 15000 m) | Placeholder, returns `future_feature: true` |
| `POST /api/chatbot` (alias `/api/chatbot/query`) | 🔓 | `{"query": "…"}` (or `message`) | Rule-based FAQ answers |
