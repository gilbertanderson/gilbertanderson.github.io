# Nutrition Scanner

Scan a food barcode to see its nutrition facts and whether it fits your diet.
Live at gilbertanderson.com/nutrition-scanner. Case study: `case-study.html`.

A static web app: no server, no build step, no accounts. The app itself lives in
`frontend/public/nutrition-scanner/`, which Vite copies unchanged into the site build;
this folder holds what isn't published (tests, proxy code, docs). Product data comes from
Open Food Facts, with optional gaps filled from USDA FoodData Central.

## Files

| File | What it is |
| --- | --- |
| (in `frontend/public/nutrition-scanner/`) | |
| `index.html` | The page, styles and Content Security Policy |
| `app.js` | The app: scanning, lookups, results, diets, recent scans, settings |
| `diets.js` | Built-in diets and their sources (every rule cites one) |
| `diet-check.js` | Checks a product against a diet |
| `usda.js`, `config.js` | Optional USDA fallback, off until `config.js` has a proxy URL |
| `xr-view.js`, `vendor/three/` | VR view (WebXR): a floating panel for Quest and PC VR, loaded only when chosen. Three.js r171 (MIT), self-hosted |
| `sw.js`, `manifest.webmanifest`, `icons/` | Installable app and offline support |
| `vendor/` | html5-qrcode 2.3.8 (Apache-2.0), self-hosted with an integrity hash |
| (in this folder) | |
| `proxy/` | USDA proxy for Cloudflare Workers or Supabase (see its README) |
| `tests/` | Automated tests; the site's deploy workflow runs them and won't deploy if they fail |
| `TESTING.md` | Checklist for real phones, VoiceOver and Meta Quest |

## Making changes

1. Edit the files.
2. If you changed any app file, bump `VERSION` in `sw.js` (e.g. `ns-v2`) so
   installed copies pick up the update.
3. If you changed the small inline `<script>` in the `<head>` of `index.html`
   (or `case-study.html`), its hash in the Content-Security-Policy must change
   too. The security tests fail and print a reminder if it's out of date.
4. Run the tests locally, or just push and let the deploy workflow run them:

```
cd nutrition-scanner/tests     # from the repo root
npm install
npx playwright install chromium
npm test
```

## Adding a diet

Add an entry to `DIETS` in `diets.js`. Give every rule a `sources` entry
pointing at `SOURCES` (with a page number for books), and a `bookList` with the
source's own wording where it has one. The rules tests check that every rule
cites a source.
