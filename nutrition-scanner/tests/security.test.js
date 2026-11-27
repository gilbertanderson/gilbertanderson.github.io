// Security: CSP, script integrity, hostile data, tampered storage and upload limits.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const crypto = require("node:crypto");
const { ROOT, startServer, launch, openApp, lookup } = require("./helpers");

let srv, browser;
test.before(async () => { srv = await startServer(); browser = await launch(); });
test.after(async () => { await browser.close(); srv.server.close(); });

const html = () => fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
const X = '"><img src=x onerror="window.__pwned=1"><script>window.__pwned=1</script>';

test("CSP is strict: scripts only from this site; inline script hash matches", () => {
  const csp = html().match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)[1];
  assert.match(csp, /default-src 'none'/);
  assert.doesNotMatch(csp, /unsafe-eval/);
  const scriptSrc = csp.match(/script-src ([^;]+)/)[1];
  assert.doesNotMatch(scriptSrc, /unsafe-inline|https:/);
  const inline = html().match(/<script>([\s\S]*?)<\/script>/)[1];
  const hash = "sha256-" + crypto.createHash("sha256").update(inline).digest("base64");
  assert.ok(scriptSrc.includes(`'${hash}'`), "inline theme script hash is out of date; update the CSP");
});

test("scanner library integrity hash matches the file", () => {
  const sri = html().match(/vendor\/html5-qrcode\.min\.js" integrity="(sha384-[^"]+)"/)[1];
  const file = fs.readFileSync(path.join(ROOT, "vendor/html5-qrcode.min.js"));
  assert.equal(sri, "sha384-" + crypto.createHash("sha384").update(file).digest("base64"));
});

test("app runs with no CSP violations", async () => {
  const page = await openApp(browser, srv.base);
  const violations = [];
  page.on("console", m => { if (/Content Security Policy/i.test(m.text())) violations.push(m.text()); });
  await page.reload();
  assert.equal(await page.evaluate(() => typeof Html5Qrcode), "function");
  await lookup(page, "12345678");
  assert.deepEqual(violations, []);
  assert.deepEqual(page.errors, []);
});

test("hostile product data is shown as text, never run", async () => {
  const evil = { product_name: X, brands: X, serving_size: X, image_front_small_url: "javascript:window.__pwned=1",
    ingredients_text: "milk, " + X, allergens_tags: [X], categories_tags: [X], nutriments: { sugars_100g: X, sodium_serving: X } };
  const page = await openApp(browser, srv.base, { products: { "11111111": evil } });
  await lookup(page, "11111111");
  await page.waitForTimeout(200);
  assert.equal(await page.evaluate(() => window.__pwned), undefined);
  assert.equal(await page.locator('#result img[src="x"], #result img[src^="javascript"], #result script').count(), 0);
});

test("hostile diet file is cleaned: no script, no javascript: links", async () => {
  const file = path.join(os.tmpdir(), "evil-diet.json");
  fs.writeFileSync(file, JSON.stringify({ name: X, summary: X, customSources: { [X]: { title: X, url: "javascript:window.__pwned=1" } },
    sources: [X, "constructor", "__proto__"], rules: [{ type: "ingredients", label: X, note: X, terms: [X, "(a+)+$"], bookList: [X], sources: [{ id: "constructor" }] }] }));
  const page = await openApp(browser, srv.base);
  await page.click("#manage summary");
  await page.setInputFiles("#dietFile", file);
  await page.click("#about summary");
  await page.waitForTimeout(200);
  assert.equal(await page.evaluate(() => window.__pwned), undefined);
  assert.equal(await page.locator('a[href^="javascript"]').count(), 0);
});

test("tampered saved data is re-checked on load", async () => {
  const page = await openApp(browser, srv.base);
  await page.evaluate(x => {
    localStorage.setItem("customDiets", JSON.stringify([{ id: "custom-x", name: x, source: { title: "T", url: "javascript:window.__pwned=1" },
      rules: [{ type: "ingredients", level: "avoid", label: x, terms: ["milk"] }] }]));
    localStorage.setItem("labelNotes", JSON.stringify({ "12345678": { traces: ["en:milk", x, "__proto__"], at: Date.now() }, [x]: { traces: [], at: 1 } }));
    localStorage.setItem("recent", JSON.stringify([{ code: "12345678", at: Date.now(), product: { product_name: x, image_front_small_url: "javascript:1" } }, { code: "<b>", at: 1, product: {} }]));
  }, X);
  await page.reload();
  await page.click("#recentPanel summary");
  assert.equal(await page.locator('a[href^="javascript"]').count(), 0);
  assert.equal(await page.locator("#recentList li").count(), 1);
  assert.equal(await page.evaluate(() => window.__pwned), undefined);
});

test("oversized diet files are refused", async () => {
  const file = path.join(os.tmpdir(), "big-diet.json");
  fs.writeFileSync(file, JSON.stringify({ name: "Big", rules: [{ type: "ingredients", label: "x", terms: Array.from({ length: 120000 }, (_, i) => "t" + i) }] }));
  const page = await openApp(browser, srv.base);
  await page.click("#manage summary");
  await page.setInputFiles("#dietFile", file);
  assert.match(await page.textContent("#manageMsg"), /over 1 MB/);
});

test("barcodes are validated before any request", async () => {
  const page = await openApp(browser, srv.base);
  let requests = 0;
  page.on("request", r => { if (r.url().includes("openfoodfacts.org/api")) requests++; });
  await lookup(page, "12");
  assert.equal(requests, 0);
  assert.equal(await page.getAttribute("#manual", "aria-invalid"), "true");
});

test("case study page runs under its CSP with no violations", async () => {
  const page = await openApp(browser, srv.base);
  const violations = [];
  page.on("console", m => { if (/Content Security Policy/i.test(m.text())) violations.push(m.text()); });
  await page.goto(srv.base + "case-study.html");
  assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), "dark");
  assert.deepEqual(violations, []);
});
