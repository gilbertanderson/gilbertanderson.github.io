// Shared test helpers: a tiny static server for the app folder, fake product APIs, and page setup.
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");

// The app itself is published from the site's public folder
const ROOT = path.resolve(__dirname, "../../frontend/public/nutrition-scanner");
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".webmanifest": "application/manifest+json",
  ".png": "image/png", ".svg": "image/svg+xml", ".css": "text/css" };

function startServer() {
  return new Promise(resolve => {
    const server = http.createServer((req, res) => {
      const url = decodeURIComponent(new URL(req.url, "http://x").pathname);
      let file = path.join(ROOT, url.endsWith("/") ? url + "index.html" : url);
      if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end("Not found"); }
      res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream" });
      fs.createReadStream(file).pipe(res);
    });
    // "localhost" so the service worker is allowed to register
    server.listen(0, "localhost", () => resolve({ server, base: `http://localhost:${server.address().port}/` }));
  });
}

// Fixture products, keyed by barcode
const PRODUCTS = {
  "12345678": { product_name: "Honey Oat Crackers", brands: "Test Co", serving_size: "30 g",
    image_front_small_url: "https://images.openfoodfacts.org/test.jpg",
    ingredients_text: "Whole wheat flour, oats, honey, coconut milk, soybean oil, cornstarch, salt, yeast, eggs",
    allergens_tags: ["en:gluten", "en:soybeans", "en:eggs"], ingredients_analysis_tags: ["en:non-vegan"],
    nutriments: { "energy-kcal_100g": 450, fat_100g: 15, "saturated-fat_100g": 2, carbohydrates_100g: 70, sugars_100g: 12,
      proteins_100g: 9, sodium_100g: 0.45, sodium_serving: 0.135, carbohydrates_serving: 21 } },
  "87654321": { product_name: "Plain Almonds", brands: "Nut Co", ingredients_text: "Almonds",
    ingredients_analysis_tags: ["en:vegan"], nutriments: { sugars_100g: 4, sodium_100g: 0, "saturated-fat_100g": 3.8 } }
};

async function fakeApis(target, overrides = {}) {
  const products = { ...PRODUCTS, ...overrides };
  await target.route("https://world.openfoodfacts.org/**", r => {
    const code = (r.request().url().match(/product\/(\d+)/) || [])[1];
    const p = products[code];
    r.fulfill({ contentType: "application/json", headers: { "access-control-allow-origin": "*" },
      body: JSON.stringify(p ? { status: 1, product: p } : { status: 0 }) });
  });
  await target.route("https://images.openfoodfacts.org/**", r =>
    r.fulfill({ contentType: "image/svg+xml", body: '<svg xmlns="http://www.w3.org/2000/svg" width="4" height="4"/>' }));
}

// SwiftShader gives headless Chromium WebGL, which the VR view needs
async function launch() { return chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] }); }

async function openApp(browser, base, { viewport = { width: 390, height: 844 }, theme, view, bypassCSP = false, products } = {}) {
  const ctx = await browser.newContext({ viewport, bypassCSP, serviceWorkers: "block" });
  await fakeApis(ctx, products);
  if (theme || view) await ctx.addInitScript(([t, v]) => {
    if (t) localStorage.setItem("theme", JSON.stringify(t));
    if (v) localStorage.setItem("view", JSON.stringify(v));
  }, [theme, view]);
  const page = await ctx.newPage();
  page.errors = [];
  page.on("pageerror", e => page.errors.push(e.message));
  await page.goto(base + "index.html");
  return page;
}

async function lookup(page, code) {
  await page.fill("#manual", code);
  await page.press("#manual", "Enter");
  await page.waitForSelector("#result h2");
}

// Run one of the app's browser scripts and return what it exports for Node
function loadScript(file) {
  const vm = require("node:vm");
  const mod = { exports: {} };
  vm.compileFunction(fs.readFileSync(path.join(ROOT, file), "utf8"), ["module"], { filename: file })(mod);
  return mod.exports;
}

module.exports = { loadScript, ROOT, startServer, launch, openApp, lookup, fakeApis, PRODUCTS };
