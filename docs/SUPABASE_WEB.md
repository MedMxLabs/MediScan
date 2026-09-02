# Supabase Auth — Web setup (MedMx LABS)

The **web app uses only Supabase Auth** for sign-in/sign-up (no legacy `/api/auth/login` or Google Identity script). After Supabase sign-in, the app exchanges the Supabase access token for a **MedScan JWT** via `POST /api/auth/supabase` and uses that for all `/api/*` calls.

Mobile may still use legacy endpoints until migrated.

## 1. Supabase project

1. Create a project at [supabase.com](https://supabase.com/dashboard).
2. **Authentication → Providers**
   - Enable **Email**
   - Enable **Google** (optional): add Google OAuth client ID/secret in Supabase
3. **Authentication → URL configuration**

| Setting | Local dev | Production |
|---------|-----------|--------------|
| **Site URL** | `http://localhost:5173` | `https://icy-pond-06a17d300.7.azurestaticapps.net` |
| **Redirect URLs** | `http://localhost:5173/auth/callback` | `https://icy-pond-06a17d300.7.azurestaticapps.net/auth/callback` |
| | `http://localhost:5173/reset-password` | `https://icy-pond-06a17d300.7.azurestaticapps.net/reset-password` |
| | `com.medmxlabs.medscan://login-callback` | *(mobile app — Android/iOS)* |

> **Google redirects to `localhost:3000`?** Your Supabase **Site URL** is wrong (often `http://localhost:3000`). Change **Site URL** to your live SWA URL above and add the production `/auth/callback` to **Redirect URLs**. Remove `localhost:3000` unless you actually run the app on port 3000.

### Enable Google (fixes `Unsupported provider: provider is not enabled`)

1. [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services → Credentials** → **Create credentials → OAuth client ID** → type **Web application**.
2. **Authorized redirect URIs** (required — use your Supabase project host):

   `https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback`

   Example for this repo’s project:  
   `https://omuxukvhmeeobyoszdde.supabase.co/auth/v1/callback`

3. Supabase dashboard → **Authentication → Providers → Google**:
   - Turn **Enable Google** ON
   - Paste **Client ID** and **Client secret** from Google
   - Save
4. Confirm **Authentication → URL configuration** includes `http://localhost:5173/auth/callback` (and production SWA URL when deployed).

Until Google is enabled, use **email + password** on `/login` — that works with only the Email provider.

4. **Project Settings → API**
   - Copy **Project URL** and **anon public** key
5. **Project Settings → API → JWT Settings**
   - Copy **JWT Secret** (backend `SUPABASE_JWT_SECRET` only — **not** the anon key)
   - New projects may use **JWT Signing Keys (JWKS)**; the backend also verifies via `…/auth/v1/.well-known/jwks.json` if HS256 fails

## 2. Backend env (`medscan/backend/.env`)

Required for token exchange:

```env
SUPABASE_URL=https://YOUR-PROJECT.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_JWT_SECRET=your-jwt-secret-from-supabase-dashboard
```

Restart Flask:

```powershell
cd medscan\backend
.\venv\Scripts\python.exe run.py
```

Verify:

```powershell
curl http://127.0.0.1:5000/api/auth/supabase/config
# → {"enabled":true,"url":"...","anon_key":"..."}
```

## 3. Frontend env (choose one)

### Option A — Frontend `.env` (recommended for Vite)

Create `medscan/frontend/.env`:

```env
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

If your API enforces a client key, also set:

```env
VITE_MEDSCAN_API_KEY=your-client-api-key
```

Restart Vite (`npm run dev`).

### Option B — Backend only

Set only `SUPABASE_*` in **backend** `.env`. The web app will load URL + anon key from `GET /api/auth/supabase/config` on first login (no `VITE_SUPABASE_*` needed).

## 4. Run the web app

```powershell
# Terminal 1 — API
cd medscan\backend
.\venv\Scripts\python.exe run.py

# Terminal 2 — Web
cd medscan\frontend
npm run dev
```

Open http://localhost:5173/login — you should see **“Secured with Supabase Auth”** when configured.

## 5. What the web app does

| Page | Supabase flow |
|------|----------------|
| `/login` | `signInWithPassword` or Google OAuth → `/auth/callback` |
| `/signup` | `signUp` + Google |
| `/forgot-password` | `resetPasswordForEmail` |
| `/reset-password` | `updateUser({ password })` from email link |
| `/auth/callback` | OAuth return → exchange for MedScan JWT |

After Supabase sign-in, the app calls `POST /api/auth/supabase` and stores the **MedScan JWT** (same as before for dashboard/API calls).

## 6. Production (Azure Static Web App)

1. Add `SUPABASE_*` to **medscan-api** App Service settings.
2. Rebuild frontend with:

```powershell
$env:VITE_SUPABASE_URL="https://YOUR-PROJECT.supabase.co"
$env:VITE_SUPABASE_ANON_KEY="eyJ..."
$env:VITE_API_URL="https://medscan-api.azurewebsites.net"
$env:VITE_MEDSCAN_API_KEY="your-client-key"
npm run build
```

3. Add production redirect URLs in Supabase (see table above).
4. Deploy `dist/` to SWA.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `Unsupported provider: provider is not enabled` (JSON on Supabase URL) | Enable **Google** under Supabase **Authentication → Providers** and add Google OAuth client ID/secret (see above) |
| `PKCE code verifier not found in storage` | Use one browser tab; hard refresh `/login` and try again. Ensure `http://localhost:5173/auth/callback` is in Supabase redirect URLs. Do not open Google sign-in in a different browser profile. |
| “Supabase is not configured” on login | Set `VITE_SUPABASE_*` or backend `SUPABASE_*`; check `/api/auth/supabase/config` |
| API 401 after login | Backend `SUPABASE_JWT_SECRET` missing or wrong; restart Flask |
| Google redirects but login fails | Add `/auth/callback` to Supabase redirect URLs |
| 403 on API after login | Set `VITE_MEDSCAN_API_KEY` to match `MEDSCAN_CLIENT_API_KEYS` on server |
| “Check your email” on signup | Disable email confirm in Supabase **Auth → Providers → Email**, or confirm email first |

See also: [SUPABASE_AUTH.md](./SUPABASE_AUTH.md) · [API_KEYS.md](./API_KEYS.md)
