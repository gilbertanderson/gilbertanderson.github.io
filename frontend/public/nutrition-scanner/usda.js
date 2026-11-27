/*
  USDA FoodData Central fallback.
  Used only when CONFIG.USDA_PROXY_URL is set, and only when Open Food Facts
  is missing the product or its ingredient list.

  Branded foods in FoodData Central report nutrients per 100 g (or 100 ml),
  the same basis Open Food Facts uses, so the diet rules work unchanged.
*/
const USDA = (() => {
  // FoodData Central nutrient numbers -> Open Food Facts nutriment keys
  const NUTRIENTS = {
    "208": ["energy-kcal", 1],        // Energy, kcal
    "204": ["fat", 1],                // Total fat, g
    "606": ["saturated-fat", 1],      // Saturated fat, g
    "605": ["trans-fat", 1],          // Trans fat, g
    "205": ["carbohydrates", 1],      // Carbohydrate, g
    "269": ["sugars", 1],             // Total sugars, g
    "291": ["fiber", 1],              // Fiber, g
    "203": ["proteins", 1],           // Protein, g
    "307": ["sodium", 0.001]          // Sodium, mg -> g
  };

  const enabled = () => typeof CONFIG !== "undefined" && /^https:\/\//i.test(CONFIG.USDA_PROXY_URL || "");

  async function fetchFood(code) {
    if (!enabled()) return null;
    const url = CONFIG.USDA_PROXY_URL.replace(/\/$/, "") + "?gtin=" + encodeURIComponent(code);
    const res = await fetch(url, { credentials: "omit", referrerPolicy: "no-referrer" });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error("USDA lookup failed");
    const data = await res.json();
    return data && typeof data.food === "object" ? data.food : null;
  }

  // Convert a FoodData Central branded food into the Open Food Facts shape the app uses
  function toProduct(food) {
    const str = v => (typeof v === "string" ? v.slice(0, 4000) : undefined);
    const nutriments = {};
    for (const n of Array.isArray(food.foodNutrients) ? food.foodNutrients : []) {
      const num = String(n.nutrientNumber ?? (n.nutrient && n.nutrient.number) ?? "");
      const value = Number(n.value ?? n.amount);
      if (!NUTRIENTS[num] || !Number.isFinite(value)) continue;
      const [key, scale] = NUTRIENTS[num];
      nutriments[key + "_100g"] = value * scale;
    }
    const size = Number(food.servingSize);
    const unit = String(food.servingSizeUnit || "").toLowerCase();
    if (Number.isFinite(size) && size > 0 && /^(g|grm|ml|mlt)$/.test(unit)) {
      for (const key of Object.keys(nutriments)) {
        nutriments[key.replace("_100g", "_serving")] = nutriments[key] * size / 100;
      }
    }
    const unitLabel = /^(g|grm)$/.test(unit) ? "g" : /^(ml|mlt)$/.test(unit) ? "ml" : unit;
    return {
      product_name: str(food.description),
      brands: str(food.brandName || food.brandOwner),
      ingredients_text: str(food.ingredients),
      serving_size: Number.isFinite(size) ? `${+size.toFixed(1)} ${unitLabel}` : undefined,
      nutriments
    };
  }

  // Fill what Open Food Facts is missing; keep its values where it has them
  function merge(off, usda) {
    const fieldSources = {};
    const out = { ...off };
    if (!off.ingredients_text && !off.ingredients_text_en && usda.ingredients_text) {
      out.ingredients_text = usda.ingredients_text;
      fieldSources.ingredients = "usda";
    }
    const offN = off.nutriments || {};
    const merged = { ...offN };
    let filled = false;
    for (const [k, v] of Object.entries(usda.nutriments || {})) {
      if (merged[k] === undefined || merged[k] === "") { merged[k] = v; filled = true; }
    }
    if (filled) { out.nutriments = merged; fieldSources.nutrition = Object.keys(offN).length ? "both" : "usda"; }
    for (const f of ["product_name", "brands", "serving_size"]) if (!out[f] && usda[f]) out[f] = usda[f];
    return { product: out, fieldSources };
  }

  return { enabled, fetchFood, toProduct, merge };
})();
