// Feature checks: install/offline, recent scans, diet editing, personal settings, USDA fallback.
const test = require("node:test");
const assert = require("node:assert/strict");
const { startServer, launch, openApp, lookup, fakeApis } = require("./helpers");

let srv, browser;
test.before(async () => { srv = await startServer(); browser = await launch(); });
test.after(async () => { await browser.close(); srv.server.close(); });

test("installable: manifest, icons and an offline cache", async () => {
  const ctx = await browser.newContext();
  await fakeApis(ctx);
  const mf = await (await ctx.request.get(srv.base + "manifest.webmanifest")).json();
  assert.equal(mf.display, "standalone");
  assert.ok(mf.icons.some(i => i.purpose === "maskable"));
  const page = await ctx.newPage();
  await page.goto(srv.base + "index.html");
  await page.waitForFunction(() => navigator.serviceWorker.controller, null, { timeout: 15000 });
  await lookup(page, "12345678");
  await ctx.setOffline(true);
  // Routes answer even when offline, so make the product API fail like a real network outage
  await ctx.route("https://world.openfoodfacts.org/**", r => r.abort("internetdisconnected"));
  await page.reload();
  assert.equal(await page.title(), "Nutrition Scanner");
  await lookup(page, "12345678");   // offline: opens the saved scan
  assert.equal(await page.textContent("#result h2"), "Honey Oat Crackers");
  assert.match(await page.textContent("#result article > p.cite"), /offline/);
  await ctx.close();
});

test("recent scans show a verdict badge and reopen", async () => {
  const page = await openApp(browser, srv.base);
  await lookup(page, "12345678");
  await lookup(page, "87654321");
  await page.click("#recentPanel summary");
  assert.deepEqual(await page.locator("#recentList .recent-name").allTextContents(), ["Plain Almonds", "Honey Oat Crackers"]);
  await page.click('[data-recent="12345678"]');
  assert.equal(await page.textContent("#result h2"), "Honey Oat Crackers");
});

test("a diet made in the form can be edited in place", async () => {
  const page = await openApp(browser, srv.base);
  await page.click("#manage summary");
  await page.fill("#fName", "My Plan");
  await page.fill("#fAvoid", "peanuts");
  await page.click("#createBtn");
  await page.click("[data-edit]");
  assert.equal(await page.inputValue("#fAvoid"), "peanuts");
  await page.fill("#fAvoid", "peanuts, honey");
  await page.click("#createBtn");
  assert.equal(await page.locator('label.chip:has-text("My Plan")').count(), 1);
  await lookup(page, "12345678");
  assert.ok((await page.locator(".reasons li strong").allTextContents()).includes("Honey"));
});

test("'Treat as avoid for me' makes a limit rule an avoid", async () => {
  const page = await openApp(browser, srv.base, { products: { "22222222": { product_name: "Egg Noodles Rice", ingredients_text: "rice flour, eggs", nutriments: { sugars_100g: 1, sodium_100g: 0.01 } } } });
  await lookup(page, "22222222");
  assert.match(await page.textContent(".verdict strong"), /Fits with caution/);
  await page.click("#about summary");
  await page.check('input[data-override="Eggs"]');
  assert.match(await page.textContent(".verdict strong"), /Doesn't fit/);
  assert.match(await page.textContent(".reasons"), /your setting/);
});

test("USDA fills a missing ingredient list and is credited", async () => {
  const ctx = await browser.newContext({ bypassCSP: true, serviceWorkers: "block" });
  await fakeApis(ctx, { "011111111111": { product_name: "Plain Chips", nutriments: { sugars_100g: 1 } } });
  await ctx.route("**/config.js", r => r.fulfill({ contentType: "text/javascript", body: 'const CONFIG = { USDA_PROXY_URL: "https://proxy.example" };' }));
  await ctx.route("https://proxy.example/**", r => r.fulfill({ contentType: "application/json", headers: { "access-control-allow-origin": "*" },
    body: JSON.stringify({ food: { description: "PLAIN CHIPS", ingredients: "POTATOES, CORN STARCH, SALT", servingSize: 28, servingSizeUnit: "g",
      foodNutrients: [{ nutrientNumber: "307", value: 500 }] } }) }));
  const page = await ctx.newPage();
  await page.goto(srv.base + "index.html");
  await lookup(page, "011111111111");
  assert.ok((await page.locator(".reasons li strong").allTextContents()).includes("Corn"));
  assert.match(await page.textContent("#result article > p.cite"), /Ingredients from FoodData Central, USDA/);
  await ctx.close();
});

test("Pecans: result shows shared equipment clearly and the strict setting works", async () => {
  const page = await openApp(browser, srv.base, { products: { "011110106865": { product_name: "Pecans", brands: "Kroger", serving_size: "1/4 cup (30 g)",
    ingredients_text: "PECANS. PROCESSED ON EQUIPMENT THAT ALSO PROCESSES SESAME, PEANUTS, OTHER TREE NUTS, MILK, SOY, AND WHEAT.",
    nutriments: { "energy-kcal_100g": 733, "saturated-fat_100g": 6.67, sugars_100g: 3.33, sodium_100g: 0, "trans-fat_100g": 0 } } } });
  await lookup(page, "011110106865");
  assert.match(await page.textContent(".verdict strong"), /Fits with caution/);
  assert.match(await page.textContent(".reasons"), /Shared equipment or "may contain": soy, peanuts/);
  assert.equal(await page.locator(".ingredients mark").count(), 0, "words in the warning are not highlighted as ingredients");
  await page.click("#about summary");
  await page.check('input[data-override="__traces__"]');
  assert.match(await page.textContent(".verdict strong"), /Doesn't fit/);
});

test("Missing warnings: the app says so, and a label check fixes the verdict", async () => {
  const page = await openApp(browser, srv.base, { products: { "011110106865": { product_name: "Pecans", brands: "Kroger",
    ingredients_text: "PECANS.", nutriments: { "saturated-fat_100g": 6.67, sugars_100g: 3.33, sodium_100g: 0 } } } });
  await lookup(page, "011110106865");
  assert.match(await page.textContent(".verdict strong"), /^Fits/);
  assert.match(await page.textContent("#labelCheck"), /Allergen warnings aren't listed/);

  // Saving with nothing picked asks for a choice instead of saving
  await page.click('[data-action="label-save"]');
  assert.equal(await page.locator("#labelNote").count(), 0);

  // What the bag actually says
  for (const name of ["Milk", "Soy", "Wheat or gluten", "Peanuts", "Tree nuts", "Sesame"]) await page.click(`#labelCheck label.chip:has-text("${name}")`);
  await page.click('[data-action="label-save"]');
  assert.match(await page.textContent(".verdict strong"), /Fits with caution/);
  assert.match(await page.textContent("#labelNote"), /From your label check.*may contain milk, soy/s);
  assert.equal(await page.evaluate(() => document.activeElement.id), "labelNote");
  assert.equal(await page.locator('#labelNote a[href="https://world.openfoodfacts.org/product/011110106865"]').count(), 1);

  // Remembered for this barcode
  await page.reload();
  await lookup(page, "011110106865");
  assert.match(await page.textContent(".verdict strong"), /Fits with caution/);
  await page.click("#recentPanel summary");
  assert.equal(await page.textContent("#recentList .tag"), "Caution");

  // Change it: no warning on the label
  await page.click('[data-action="label-change"]');
  await page.click('[data-action="label-none"]');
  assert.match(await page.textContent(".verdict strong"), /^Fits ·/);
  assert.match(await page.textContent("#labelNote"), /no shared-equipment/);
});

test("No label check when the database already lists warnings", async () => {
  const page = await openApp(browser, srv.base, { products: { "33333333": { product_name: "Almonds", ingredients_text: "Almonds",
    traces_tags: ["en:peanuts"], nutriments: { sugars_100g: 4, sodium_100g: 0 } } } });
  await lookup(page, "33333333");
  assert.equal(await page.locator("#labelCheck").count(), 0);
  assert.match(await page.textContent(".reasons"), /peanuts/);
});

test("Glasses view: black background, no camera button without a camera, Back returns to scanning", async () => {
  const page = await openApp(browser, srv.base, { view: "glasses", viewport: { width: 600, height: 600 } });
  assert.equal(await page.evaluate(() => getComputedStyle(document.body).backgroundColor), "rgb(0, 0, 0)");
  await page.waitForFunction(() => document.getElementById("startBtn").hidden);   // test browser has no camera
  assert.match(await page.getAttribute("#manual", "placeholder"), /say/);
  await lookup(page, "12345678");
  assert.match(await page.textContent(".verdict strong"), /Doesn't fit/);
  await page.goBack();
  await page.waitForSelector(".empty-state");
  assert.equal(await page.evaluate(() => document.activeElement.id), "manual");
});
