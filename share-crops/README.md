# Share Crops (static demo)

Live at https://gilbertanderson.com/share-crops/ · [case study](https://gilbertanderson.com/share-crops/case-study.html)

The [full-stack Share Crops app](https://github.com/gilbertanderson/share-crops-v2) rebuilt to run on GitHub Pages with no server. Every screen is the same React code; only `src/lib/api.ts` changed. It keeps the same `API` surface but answers from a database in `localStorage` instead of the Hono + Supabase backend, and enforces the same rules the server did.

| Folder | What's in it |
| --- | --- |
| `src/lib/api.ts` | The API class, backed by the in-browser db |
| `src/lib/auth.ts` | Local accounts and one-tap guest sign-in (replaces Firebase Auth) |
| `src/lib/demo/seed.ts` | The sample neighborhood: Las Cimas, Mueller and Hyde Park |
| `src/lib/demo/neighbors.ts` | Simulated neighbors who accept offers, reply and rate back on a short delay |
| `tests/` | Playwright + axe-core tests against the production build |

```bash
npm install
npm run dev          # http://localhost:5173/share-crops/
npm run build        # type-check + build to dist/
cd tests && npm install && npx playwright install chromium && npm test
```

The site's deploy workflow builds this into `frontend/dist/share-crops` and won't deploy if these tests fail.
