# Cost policy — $0 on GitHub

MedMx Labs keeps **GitHub at $0**. Azure (Microsoft for Startups credits) is separate and only touched when someone **manually** deploys.

## GitHub Free checklist

| Setting | Our choice | Why it's $0 |
| --- | --- | --- |
| Org plan | **Free** | No Teams / Enterprise seat fees |
| Repos | **Public** only (`.github`, `MediScan`) | Public Actions minutes are free on `ubuntu-latest` |
| Private repos | **None** | Avoid private Actions minute quotas |
| Runners | `ubuntu-latest` only | No macOS / larger / self-hosted paid SKUs |
| Deploy workflows | **`workflow_dispatch` only** | Pushes/PRs do not deploy to Azure |
| CI (`ci.yml`) | PR + manual | Lint/test only — no Azure, still free on public |
| Dependabot | Enabled | Free for public repos |
| Wiki / Issues / Discussions | On | Free |
| GitHub Pages | Off | Not needed (SWA hosts the site) |
| Copilot / Advanced Security paid | **Not used** | Would bill the org |

## What spends money (not GitHub)

| Service | When it costs | How we avoid surprise spend |
| --- | --- | --- |
| Azure App Service / ACR / SWA / Postgres | Running cloud + **manual** deploy workflows | Do not click **Run workflow** unless you mean it |
| Supabase / LLM / Document Intelligence | Your own API keys | Optional; leave unset for local OSS contrib |
| Play Store | Publishing an APK | Optional; sideload is free |

## Rules for maintainers

1. **Never** create a private repo under `MedMxLabs` unless you accept private Actions limits / possible billing.
2. **Never** add `runs-on: macos-*`, `windows-*` (unless free tier is enough and intentional), or larger GitHub-hosted runners.
3. **Never** switch deploy workflows back to `on: push` without updating this doc.
4. Prefer local `pytest` / `npm run lint` / `flutter test` before burning CI for tiny docs PRs (optional courtesy).

## Verify billing

GitHub → **MedMxLabs** → **Settings** → **Billing** — plan should read **Free**, usage near zero unless you ran many Actions. Azure billing is under the Azure portal / Startups credits, not GitHub.
