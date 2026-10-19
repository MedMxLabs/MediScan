# Frontend (React web app + PWA)

React 19, Vite (Rolldown), Tailwind v4, Redux Toolkit (auth only), axios, framer-motion, recharts. Deployed to Azure Static Web Apps; installable as a PWA.

## Layout

```
frontend/src/
├── main.jsx / App.jsx     Entry, router, lazy-loaded pages
├── api/client.js          axios instance: base URL, API key header, Bearer token, 401 → refresh → retry
├── services/api.js        One function per backend endpoint + scrape-job polling (getScraped)
├── auth/                  Supabase sign-in, MedScan JWT exchange, session storage, OAuth redirect guard
├── lib/supabase.js        Supabase client (env or /api/auth/supabase/config)
├── store/slices/authSlice.js  Signed-in user + tokens
├── pages/                 One file per route (all lazy)
├── layout/                Dashboard shell (sidebar, top bar)
├── components/            Shared UI; ui/ = primitives (Card, Input, PageHeader, EmptyState…)
├── hooks/                 useAsync and friends
├── utils/                 Formatting, a11y helpers, reminder notifications
├── constants/             Static lists and copy
├── pwa/                   Service-worker registration (prod only)
└── assets/                Logos (webp)
```

## Environment

Set in `frontend/.env` (dev) or as build args in CI. All `VITE_*` values end up in the public bundle, so never put secrets here.

| Variable | What |
| --- | --- |
| `VITE_API_URL` | Backend origin. Leave empty in dev to use the Vite proxy |
| `VITE_MEDSCAN_API_KEY` | Client API key (one of `MEDSCAN_CLIENT_API_KEYS`) |
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | Optional. Fetched from the backend if blank |
| `VITE_OMNIDIMENSION_WIDGET_SECRET` | Optional voice-assistant widget |
| `MEDSCAN_API_PROXY` | Dev proxy target (default `http://127.0.0.1:5000`) |

## Commands

```powershell
cd frontend
npm install
npm run dev        # http://localhost:5173, proxies /api and /health to the backend
npm run lint
npm run build      # → dist/
npm run copy:apk   # copy the built Android APK into public/ for the download link
```

## How things work

**API calls.** Pages call functions from `services/api.js`, never axios directly. `client.js` adds headers, and on a 401 it refreshes the token once (requests running at the same moment wait on the same refresh) and retries. If the refresh fails, it signs you out.

**Searches that take a while.** `searchMedicine`, `compareMedicines` and `getAlternatives` go through `getScraped()`. If the backend replies 202 pending, it polls `/api/scrape-jobs/<id>` every ~2 s and asks again when the job is done. Pages just `await` it, the same as before. See [api-reference.md](api-reference.md#background-scrapes-202-flow).

**Auth.** Supabase handles email/password and Google. After sign-in, `auth/supabaseAuth.js` swaps the Supabase token for MedScan JWTs (`POST /api/auth/supabase`) and stores them. Details: [SUPABASE_WEB.md](SUPABASE_WEB.md).

**Bundle.** Every page is `React.lazy`. `vite.config.js` splits vendor code into fixed groups (`vendor`, `charts`, `motion`) so pages share cached chunks. If you add a heavy dependency, give it a group.

**PWA.** `vite-plugin-pwa` generates the manifest and service worker. The service worker is registered in production only, so dev never serves stale assets.

## Adding a page

1. Create `pages/MyPage.jsx`.
2. Add a lazy route in `App.jsx` (inside the protected layout if it needs sign-in).
3. Add the backend call to `services/api.js`.
4. Add a sidebar link in `layout/` if it should be in the nav.
