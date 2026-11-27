/*
  Checks an Open Food Facts product against a diet profile from diets.js.
  Returns { verdict, results } where verdict is "avoid", "caution", "ok" or "unknown".

  Cross-contact ("may contain", "processed on equipment that also processes ...")
  is handled separately from ingredients: those statements are not ingredients, so
  they are taken out of the ingredient text and reported as their own caution.
  A diet with tracesAsAvoid (a personal setting) treats them as avoid instead.
*/
function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function termRegex(term) {
  // Whole word or phrase, with optional plural ending
  return new RegExp("\\b" + escapeRegex(term).replace(/[\s-]+/g, "[\\s-]+") + "(?:s|es)?\\b", "i");
}

// Allergen statements that describe cross-contact, not ingredients
const CROSS_CONTACT = new RegExp(
  "(?:may (?:also )?contain|may contain traces of|traces? of|" +
  "(?:processed|produced|manufactured|made|packed|packaged)\\s+(?:on|in)\\s+(?:a\\s+)?(?:shared\\s+)?" +
  "(?:equipment|facilit(?:y|ies)|plant|line)s?(?:\\s+(?:that|which)\\s+(?:also\\s+)?(?:processes|handles|uses|packages|makes))?)" +
  "[^.;]*", "gi");

const CROSS_CONTACT_WORDS = [
  [/\b(milk|dairy|whey|casein)\b/i, "en:milk"],
  [/\b(soy|soya|soybeans?)\b/i, "en:soybeans"],
  [/\bpeanuts?\b/i, "en:peanuts"],
  [/\b(wheat|gluten|barley|rye)\b/i, "en:gluten"],
  [/\beggs?\b/i, "en:eggs"],
  [/\bsesame\b/i, "en:sesame-seeds"],
  [/\b(tree nuts?|nuts|almonds?|cashews?|walnuts?|pecans?|hazelnuts?|pistachios?)\b/i, "en:nuts"],
  [/\bfish\b/i, "en:fish"],
  [/\b(shellfish|crustaceans?|shrimp|crab|lobster)\b/i, "en:crustaceans"],
  [/\blupin\b/i, "en:lupin"]
];

// Where the cross-contact statements sit in the text (used to skip them)
function crossContactRanges(text) {
  const out = [];
  for (const m of String(text || "").matchAll(CROSS_CONTACT)) out.push([m.index, m.index + m[0].length]);
  return out;
}

// Ingredient text with cross-contact statements removed
function ingredientsOnly(text) {
  return String(text || "").replace(CROSS_CONTACT, " ");
}

// Trace tags from Open Food Facts plus any found in "may contain"/shared-equipment wording
function traceTags(product) {
  const tags = new Set(Array.isArray(product.traces_tags) ? product.traces_tags : []);
  const text = [product.ingredients_text_en || product.ingredients_text || "", typeof product.traces === "string" ? "may contain " + product.traces : ""].join(" . ");
  for (const m of text.matchAll(CROSS_CONTACT)) {
    for (const [re, tag] of CROSS_CONTACT_WORDS) if (re.test(m[0])) tags.add(tag);
  }
  return [...tags];
}

function cleanIngredients(text, exceptions) {
  let t = " " + ingredientsOnly(text).toLowerCase().replace(/_/g, "") + " ";
  for (const ex of exceptions || []) {
    t = t.replace(new RegExp(termRegex(ex).source, "gi"), " ");
  }
  return t;
}

// "wheat, whole wheat, whole-wheat" -> "whole wheat": drop repeats and words already inside a longer match
function tidyFound(list) {
  const norm = s => s.toLowerCase().replace(/[\s-]+/g, " ");
  const unique = [...new Map(list.map(s => [norm(s), s])).values()];
  return unique.filter(s => !unique.some(o => o !== s && termRegex(norm(s)).test(norm(o)) && !o.includes("(")));
}

const TRACE_WORD = { "en:milk": "milk", "en:soybeans": "soy", "en:peanuts": "peanuts", "en:gluten": "wheat or gluten", "en:eggs": "eggs",
  "en:sesame-seeds": "sesame", "en:nuts": "tree nuts", "en:fish": "fish", "en:crustaceans": "shellfish", "en:molluscs": "shellfish", "en:lupin": "lupin" };

function checkIngredientRule(rule, product, diet, traces) {
  const found = [];
  const tagHit = (list, tags) => (list || []).filter(tag => (tags || []).includes(tag));

  for (const tag of tagHit(rule.allergens, product.allergens_tags)) found.push(tag.replace("en:", "") + " (allergen)");
  for (const tag of tagHit(rule.additives, product.additives_tags)) found.push(tag.replace("en:", "").toUpperCase());
  for (const tag of tagHit(rule.categories, product.categories_tags)) found.push(tag.replace("en:", "").replace(/-/g, " ") + " (category)");
  for (const tag of tagHit(rule.analysis, product.ingredients_analysis_tags)) found.push(tag.replace("en:", "").replace(/-/g, " ") + " (Open Food Facts)");

  const text = cleanIngredients(product.ingredients_text_en || product.ingredients_text, rule.exceptions);
  const matchedTerms = [];
  for (const term of rule.terms || []) {
    if (termRegex(term).test(text)) { found.push(term); matchedTerms.push(term); }
  }

  if (found.length) return { level: rule.level, found: tidyFound(found), matchedTerms };

  // Cross-contact only matters for rules that exclude a food outright
  const hits = rule.level === "avoid" ? tagHit(rule.allergens, traces) : [];
  if (hits.length) {
    const words = [...new Set(hits.map(t => TRACE_WORD[t] || t.replace("en:", "")))];
    return { level: diet && diet.tracesAsAvoid ? "avoid" : "caution", crossContact: true,
             found: words };
  }
  const maybe = tagHit(rule.analysisCaution, product.ingredients_analysis_tags);
  if (maybe.length) {
    return { level: "caution", found: maybe.map(t => t.replace("en:", "").replace(/-/g, " ") + " (Open Food Facts)") };
  }
  return { level: "ok", found: [] };
}

// True when every ingredient is one of the rule's exempt items, e.g. a bag of plain pecans
function onlyExemptIngredients(rule, product) {
  const ex = rule.exemptIfOnly;
  if (!ex || !(ex.terms || []).length) return false;
  const text = ingredientsOnly(product.ingredients_text_en || product.ingredients_text).toLowerCase()
    .replace(/^\s*ingredients?\s*:/, "").replace(/\([^)]*\)/g, " ");
  const items = text.split(/[,.;:]| and /).map(s => s.trim()).filter(Boolean);
  if (!items.length) return false;
  const allowed = [...ex.terms, ...(ex.allow || [])];
  return items.every(item => allowed.some(t => termRegex(t).test(item)) &&
    item.split(/\s+/).length <= 4);   // short items only: "dry roasted almonds", not a long compound ingredient
}

function checkNutrientRule(rule, product) {
  const raw = (product.nutriments || {})[rule.nutrient];
  if (raw === undefined || raw === null || raw === "") return { level: "unknown", found: [] };
  const value = Number(raw) * (rule.scale || 1);
  const shown = `${+value.toFixed(1)} ${rule.unit} per 100 g`;
  if (onlyExemptIngredients(rule, product)) return { level: "ok", found: [shown], exempt: true };

  if (rule.max !== undefined && value > rule.max) return { level: rule.level || "avoid", found: [shown] };
  if (rule.avoidAbove !== undefined && value > rule.avoidAbove) return { level: "avoid", found: [shown] };
  if (rule.cautionAbove !== undefined && value > rule.cautionAbove) return { level: "caution", found: [shown] };
  return { level: "ok", found: [shown] };
}

function evaluateDiet(product, diet) {
  const hasIngredients = !!ingredientsOnly(product.ingredients_text_en || product.ingredients_text).replace(/[\s.,;:]/g, "");
  const traces = traceTags(product);
  const results = diet.rules.map(rule => {
    const r = rule.type === "nutrient" ? checkNutrientRule(rule, product) : checkIngredientRule(rule, product, diet, traces);
    // An ingredient rule that found nothing can't be trusted if there is no ingredient list
    if (rule.type === "ingredients" && r.level === "ok" && !hasIngredients && (rule.terms || []).length) {
      r.level = "unknown";
    }
    return { rule, ...r };
  });

  const levels = results.map(r => r.level);
  let verdict = "ok";
  if (levels.includes("avoid")) verdict = "avoid";
  else if (levels.includes("unknown") && !hasIngredients) verdict = "unknown";
  else if (levels.includes("caution")) verdict = "caution";

  return { verdict, hasIngredients, results };
}

if (typeof module !== "undefined") module.exports = { evaluateDiet, termRegex, crossContactRanges, traceTags };
