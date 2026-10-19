# GitHub Actions (free on public repos)

| Workflow | Trigger | What it does | GitHub cost | Azure cost |
| --- | --- | --- | --- | --- |
| `ci.yml` | PR / push to `main` (skips docs-only) / manual | pytest, lint, Flutter analyze | **$0** (`ubuntu-latest`) | None |
| `deploy-backend.yml` | **Manual only** | Build image → ACR → App Service | **$0** Actions | Uses Azure credits |
| `deploy-frontend.yml` | **Manual only** | Build web (+ APK) → SWA | **$0** Actions | Uses Azure credits |

Policy: [COST.md](COST.md).

## Run a deploy

1. Repo → **Actions**
2. Pick **Deploy Backend** or **Deploy Frontend**
3. **Run workflow** → `main`

Do this only when you intend to ship.
