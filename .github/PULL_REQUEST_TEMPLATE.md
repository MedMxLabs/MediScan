## Summary

<!-- What changed and why (1–3 bullets). -->

-

## Test plan

<!-- Commands / manual checks you ran. Delete rows that don't apply. -->

- [ ] `cd backend && python -m pytest tests/ -q`
- [ ] `cd frontend && npm run lint && npm run build`
- [ ] `cd mobile && flutter analyze && flutter test`
- [ ] Manual: …
- [ ] Docs updated (`docs/api-reference.md` / `changelog.md` if behaviour changed)

## Notes

- API contract change? Ship **backend + web + APK** together (clients must handle `202` pending scrapes).
- No secrets in this PR (`.env`, keys, `key.properties`, real JWTs).
