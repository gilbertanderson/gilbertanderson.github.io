/*
  Nutrition Scanner: USDA FoodData Central proxy (Cloudflare Worker)

  Keeps your api.data.gov key secret and answers one question:
  "which USDA branded food has this barcode?"

  GET  https://<your-worker>.workers.dev/?gtin=012345678905
  200  { "food": { description, brandOwner, brandName, gtinUpc, ingredients,
                   servingSize, servingSizeUnit, foodNutrients: [...] } }
  404  { "error": "not_found" }

  Settings (Workers > your worker > Settings > Variables):
    FDC_API_KEY      secret, your key from https://api.data.gov/signup/
    ALLOWED_ORIGIN   https://gilbertanderson.com
*/
const FDC_SEARCH = "https://api.nal.usda.gov/fdc/v1/foods/search";
const KEEP = ["description", "brandOwner", "brandName", "gtinUpc", "ingredients", "servingSize", "servingSizeUnit"];
const NUTRIENTS = new Set(["208", "204", "606", "605", "205", "269", "291", "203", "307"]);

const digits = s => String(s || "").replace(/^0+/, "");

export default {
  async fetch(request, env, ctx) {
    const origin = env.ALLOWED_ORIGIN || "https://gilbertanderson.com";
    const cors = {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Vary": "Origin",
      "X-Content-Type-Options": "nosniff"
    };
    const json = (status, body, extra = {}) =>
      new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...cors, ...extra } });

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (request.method !== "GET") return json(405, { error: "method_not_allowed" });

    // Only answer the site itself (browsers send Origin on cross-site fetches)
    const reqOrigin = request.headers.get("Origin");
    if (reqOrigin && reqOrigin !== origin) return json(403, { error: "forbidden" });

    const gtin = new URL(request.url).searchParams.get("gtin") || "";
    if (!/^\d{6,14}$/.test(gtin)) return json(400, { error: "bad_barcode" });

    // Cache answers for a day so repeat scans don't use up the key's hourly limit
    const cacheKey = new Request(`https://cache.local/fdc/${gtin}`);
    const cached = await caches.default.match(cacheKey);
    if (cached) return new Response(cached.body, { status: cached.status, headers: { ...Object.fromEntries(cached.headers), ...cors } });

    const res = await fetch(`${FDC_SEARCH}?api_key=${encodeURIComponent(env.FDC_API_KEY)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: gtin, dataType: ["Branded"], pageSize: 25 })
    });
    if (!res.ok) return json(502, { error: "usda_unavailable", status: res.status });

    const data = await res.json();
    const match = (data.foods || []).find(f => digits(f.gtinUpc) === digits(gtin));
    const out = match
      ? json(200, { food: slim(match) }, { "Cache-Control": "public, max-age=86400" })
      : json(404, { error: "not_found" }, { "Cache-Control": "public, max-age=86400" });
    ctx.waitUntil(caches.default.put(cacheKey, out.clone()));
    return out;
  }
};

// Send back only what the app uses
function slim(food) {
  const out = {};
  for (const k of KEEP) if (food[k] !== undefined) out[k] = food[k];
  out.foodNutrients = (food.foodNutrients || [])
    .filter(n => NUTRIENTS.has(String(n.nutrientNumber)))
    .map(n => ({ nutrientNumber: String(n.nutrientNumber), value: n.value, unitName: n.unitName }));
  return out;
}
