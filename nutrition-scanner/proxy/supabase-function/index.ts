/*
  Nutrition Scanner: USDA FoodData Central proxy (Supabase Edge Function)

  Same contract as the Cloudflare Worker version:
  GET  https://<project>.supabase.co/functions/v1/usda-lookup?gtin=012345678905
  200  { "food": {...} }   404 { "error": "not_found" }

  Deploy:
    supabase functions new usda-lookup         (then replace its index.ts with this file)
    supabase secrets set FDC_API_KEY=<your key> ALLOWED_ORIGIN=https://gilbertanderson.com
    supabase functions deploy usda-lookup --no-verify-jwt
  (--no-verify-jwt lets the public site call it without a Supabase login;
   the origin check below and USDA's own rate limit still apply.)
*/
const FDC_SEARCH = "https://api.nal.usda.gov/fdc/v1/foods/search";
const KEEP = ["description", "brandOwner", "brandName", "gtinUpc", "ingredients", "servingSize", "servingSizeUnit"];
const NUTRIENTS = new Set(["208", "204", "606", "605", "205", "269", "291", "203", "307"]);
const digits = (s: unknown) => String(s ?? "").replace(/^0+/, "");

Deno.serve(async (req: Request) => {
  const origin = Deno.env.get("ALLOWED_ORIGIN") ?? "https://gilbertanderson.com";
  const cors = {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Vary": "Origin",
    "X-Content-Type-Options": "nosniff",
  };
  const json = (status: number, body: unknown, extra: Record<string, string> = {}) =>
    new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...cors, ...extra } });

  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "GET") return json(405, { error: "method_not_allowed" });

  const reqOrigin = req.headers.get("Origin");
  if (reqOrigin && reqOrigin !== origin) return json(403, { error: "forbidden" });

  const gtin = new URL(req.url).searchParams.get("gtin") ?? "";
  if (!/^\d{6,14}$/.test(gtin)) return json(400, { error: "bad_barcode" });

  const res = await fetch(`${FDC_SEARCH}?api_key=${encodeURIComponent(Deno.env.get("FDC_API_KEY") ?? "")}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: gtin, dataType: ["Branded"], pageSize: 25 }),
  });
  if (!res.ok) return json(502, { error: "usda_unavailable", status: res.status });

  const data = await res.json();
  // deno-lint-ignore no-explicit-any
  const match = (data.foods ?? []).find((f: any) => digits(f.gtinUpc) === digits(gtin));
  if (!match) return json(404, { error: "not_found" }, { "Cache-Control": "public, max-age=86400" });

  // deno-lint-ignore no-explicit-any
  const food: Record<string, any> = {};
  for (const k of KEEP) if (match[k] !== undefined) food[k] = match[k];
  food.foodNutrients = (match.foodNutrients ?? [])
    // deno-lint-ignore no-explicit-any
    .filter((n: any) => NUTRIENTS.has(String(n.nutrientNumber)))
    // deno-lint-ignore no-explicit-any
    .map((n: any) => ({ nutrientNumber: String(n.nutrientNumber), value: n.value, unitName: n.unitName }));
  return json(200, { food }, { "Cache-Control": "public, max-age=86400" });
});
