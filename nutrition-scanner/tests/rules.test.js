// Diet rule checks: no browser needed.
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadScript } = require("./helpers");
// The app's files are classic browser scripts; load them the same way here
const { DIETS, SOURCES } = loadScript("diets.js");
const { evaluateDiet } = loadScript("diet-check.js");

const diet = id => DIETS.find(d => d.id === id);
const verdict = (id, product) => evaluateDiet(product, diet(id)).verdict;
const flagged = (id, product) => evaluateDiet(product, diet(id)).results.filter(r => r.level === "avoid" || r.level === "caution").map(r => r.rule.label);

test("diet order is Best Bet, Vegan, Diabetic, then No diet", () => {
  assert.deepEqual(DIETS.map(d => d.id), ["best-bet", "vegan", "diabetic", "none"]);
});

test("every rule cites a source that exists", () => {
  for (const d of DIETS) for (const r of d.rules) {
    assert.ok(r.sources && r.sources.length, `${d.name} > ${r.label} has no source`);
    for (const s of r.sources) assert.ok(SOURCES[s.id], `${d.name} > ${r.label} cites unknown source ${s.id}`);
  }
});

test("Best Bet: gluten list from cookbook page 39 is covered", () => {
  const g = diet("best-bet").rules.find(r => r.label === "Gluten");
  assert.deepEqual(g.sources, [{ id: "bbd", page: "39" }]);
  for (const word of ["wheat", "rye", "barley", "oat", "spelt", "kamut", "triticale", "bulgar", "durham", "soy flour"]) {
    assert.equal(verdict("best-bet", { ingredients_text: word, nutriments: {} }), "avoid", word);
  }
});

test("Best Bet: exceptions are not flagged", () => {
  for (const ok of ["coconut milk", "cocoa butter", "vanilla bean", "eggplant", "buckwheat", "butternut squash"]) {
    const labels = flagged("best-bet", { ingredients_text: ok, nutriments: {} });
    assert.ok(!labels.includes("Dairy") && !labels.includes("Gluten") && !labels.includes("Legumes") && !labels.includes("Eggs"), `${ok} -> ${labels}`);
  }
});

test("Best Bet: legumes, sweeteners, beer and corn", () => {
  assert.equal(verdict("best-bet", { ingredients_text: "fava flour", nutriments: {} }), "avoid");
  assert.equal(verdict("best-bet", { ingredients_text: "water", additives_tags: ["en:e951"], nutriments: {} }), "avoid");
  assert.equal(verdict("best-bet", { ingredients_text: "water, barley malt", categories_tags: ["en:beers"], nutriments: {} }), "avoid");
  assert.deepEqual(flagged("best-bet", { ingredients_text: "potatoes, cornstarch", nutriments: { sugars_100g: 1, sodium_100g: 0.05 } }), ["Corn"]);
});

test("Best Bet: sugar and sodium cutoffs follow the NHS label limits", () => {
  assert.equal(verdict("best-bet", { ingredients_text: "dates", nutriments: { sugars_100g: 30 } }), "avoid");
  assert.equal(verdict("best-bet", { ingredients_text: "apples", nutriments: { sugars_100g: 10 } }), "caution");
  assert.equal(verdict("best-bet", { ingredients_text: "salt, water", nutriments: { sodium_100g: 0.7 } }), "avoid");
});

test("Vegan uses the Open Food Facts flag and the ingredient list", () => {
  assert.equal(verdict("vegan", { ingredients_text: "almonds", ingredients_analysis_tags: ["en:vegan"], nutriments: {} }), "ok");
  assert.equal(verdict("vegan", { ingredients_text: "oats, honey", nutriments: {} }), "avoid");
  assert.equal(verdict("vegan", { ingredients_text: "sugar, natural flavor", nutriments: {} }), "caution");
});

test("Diabetic flags sugary drinks and refined grains", () => {
  assert.equal(verdict("diabetic", { ingredients_text: "water, sugar", categories_tags: ["en:sodas"], nutriments: { sugars_100g: 10 } }), "avoid");
  assert.ok(flagged("diabetic", { ingredients_text: "enriched flour, salt", nutriments: { sugars_100g: 1 } }).includes("Refined grains"));
  assert.ok(!flagged("diabetic", { ingredients_text: "whole wheat flour, salt", nutriments: { sugars_100g: 1 } }).includes("Refined grains"));
});

test("No ingredient list gives 'can't fully check', not a pass", () => {
  assert.equal(verdict("best-bet", { nutriments: { sugars_100g: 1 } }), "unknown");
});

// Real product from testing: Kroger Pecans, UPC 011110106865.
// Ingredients: pecans. Label: "Processed on equipment that also processes sesame, peanuts,
// other tree nuts, milk, soy, and wheat."
const PECANS = { product_name: "Pecans", brands: "Kroger", ingredients_text: "PECANS.",
  nutriments: { "saturated-fat_100g": 6.67, sugars_100g: 3.33, sodium_100g: 0, "trans-fat_100g": 0 } };
const SHARED = "PECANS. PROCESSED ON EQUIPMENT THAT ALSO PROCESSES SESAME, PEANUTS, OTHER TREE NUTS, MILK, SOY, AND WHEAT.";

test("Pecans: plain nuts are not flagged for saturated fat (cookbook pages 22 and 56)", () => {
  assert.equal(verdict("best-bet", PECANS), "ok");
});

test("Pecans: shared-equipment statement is a caution, not an ingredient", () => {
  const r = evaluateDiet({ ...PECANS, ingredients_text: SHARED }, diet("best-bet"));
  assert.equal(r.verdict, "caution");
  const cross = r.results.filter(x => x.crossContact);
  assert.deepEqual(cross.map(x => x.rule.label).sort(), ["Dairy", "Gluten", "Legumes"]);
  assert.ok(cross.find(x => x.rule.label === "Legumes").found.includes("soy"));
});

test("Pecans: same result when the warning arrives as Open Food Facts trace tags", () => {
  const r = evaluateDiet({ ...PECANS, traces_tags: ["en:sesame-seeds", "en:peanuts", "en:nuts", "en:milk", "en:soybeans", "en:gluten"] }, diet("best-bet"));
  assert.equal(r.verdict, "caution");
});

test("Pecans: the strict personal setting makes cross-contact an avoid", () => {
  assert.equal(evaluateDiet({ ...PECANS, ingredients_text: SHARED }, { ...diet("best-bet"), tracesAsAvoid: true }).verdict, "avoid");
});

test("Nut exemption doesn't cover mixed products, and real soy is still an avoid", () => {
  assert.ok(flagged("best-bet", { ingredients_text: "Pecans, dark chocolate (sugar, cocoa butter)", nutriments: { "saturated-fat_100g": 12 } }).includes("Saturated fat"));
  assert.equal(verdict("best-bet", { ingredients_text: "Pecans, soy sauce. May contain milk.", nutriments: {} }), "avoid");
});
