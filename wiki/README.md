# Wiki source

These Markdown files are the GitHub Wiki content for MediScan.

GitHub only creates `MediScan.wiki.git` **after** the first page exists in the UI.

## Publish

1. Open https://github.com/MedMxLabs/MediScan/wiki
2. Click **Create the first page**
3. Title: `Home`
4. Paste the contents of `Home.md` (or a short placeholder) → **Save**
5. From the repo root:

```powershell
.\scripts\publish-wiki.ps1
```

That pushes Home, Getting-Started, Architecture-Overview, Docs-Map, Contributing, Good-First-Issues, Roadmap, FAQ, and `_Sidebar`.
