# USDA fallback proxy

Nutrition Scanner works with Open Food Facts alone. This optional proxy fills in
products, or ingredient lists, that Open Food Facts is missing by looking the
barcode up in USDA FoodData Central's Branded Foods data (public domain, CC0).

USDA requires a free api.data.gov key. A key placed in the site's own code would be
visible to anyone, so this small proxy holds the key and answers barcode lookups.
Pick one of the two versions; both behave the same.

## 1. Get a key

Sign up at https://api.data.gov/signup/ . A registered key allows 1,000 requests
an hour. (The shared DEMO_KEY only allows 30 an hour and 50 a day per IP address,
which is fine for a quick test but not for visitors.)

## 2a. Cloudflare Worker (free tier is plenty)

1. In the Cloudflare dashboard: Workers & Pages > Create > Worker. Paste
   `cloudflare-worker/worker.js` and deploy.
2. Settings > Variables: add `FDC_API_KEY` as a **secret**, and
   `ALLOWED_ORIGIN` = `https://gilbertanderson.com`.
3. Your URL looks like `https://nutrition-usda.<you>.workers.dev`.

## 2b. Supabase Edge Function

Follow the deploy steps at the top of `supabase-function/index.ts`.
Your URL looks like `https://<project>.supabase.co/functions/v1/usda-lookup`.

## 3. Turn it on in the app

1. In `config.js`, set `USDA_PROXY_URL` to your proxy URL.
2. In `index.html`, add the proxy's origin to `connect-src` in the
   Content-Security-Policy, for example:
   `connect-src https://world.openfoodfacts.org https://nutrition-usda.you.workers.dev;`
3. In `sw.js`, bump `VERSION` (for example `ns-v2`) so installed copies update.

Test it: open `https://<your-proxy>/?gtin=<a barcode>` in the browser address bar,
which returns the USDA match as JSON. Then, from the site, scan a product Open Food
Facts doesn't have; the result card will say the data came from USDA.

The origin check stops other websites from calling the proxy from their pages,
but anyone can still open the URL directly. Answers are cached for a day, and USDA
rate-limits the key, so the worst case is the key hitting its hourly limit; if that
ever happens, regenerate the key.

## Credit

USDA asks that apps credit FoodData Central as the source. The app does this on
every result that uses USDA data and in its Sources section.
