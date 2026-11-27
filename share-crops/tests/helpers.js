// Shared test helpers: a static server that mounts the built app at /share-crops/
// (as GitHub Pages does), stubbed photo CDN, and page setup.
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");

const ROOT = path.resolve(process.env.SHARE_CROPS_DIST || path.join(__dirname, "../dist"));
const MOUNT = "/share-crops/";
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json",
  ".webmanifest": "application/manifest+json", ".png": "image/png", ".svg": "image/svg+xml",
  ".woff2": "font/woff2", ".woff": "font/woff" };

function startServer() {
  if (!fs.existsSync(path.join(ROOT, "index.html"))) throw new Error(`No build at ${ROOT}. Run "npm run build" in share-crops/ first.`);
  return new Promise(resolve => {
    const server = http.createServer((req, res) => {
      const url = decodeURIComponent(new URL(req.url, "http://x").pathname);
      if (!url.startsWith(MOUNT)) { res.writeHead(404); return res.end("Not found"); }
      const rel = url.slice(MOUNT.length);
      const file = path.join(ROOT, rel === "" ? "index.html" : rel);
      if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end("Not found"); }
      res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream" });
      fs.createReadStream(file).pipe(res);
    });
    server.listen(0, "localhost", () => resolve({ server, base: `http://localhost:${server.address().port}${MOUNT}` }));
  });
}

async function launch() { return chromium.launch(); }

const PIXEL = '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="6"><rect width="8" height="6" fill="#c84"/></svg>';

/** Open the app in a fresh, isolated browser context. Records every request and page error. */
async function openApp(browser, base, { viewport = { width: 390, height: 844 }, bypassCSP = false, hash = "" } = {}) {
  const ctx = await browser.newContext({ viewport, bypassCSP, serviceWorkers: "block" });
  await ctx.route("https://images.unsplash.com/**", r => r.fulfill({ contentType: "image/svg+xml", body: PIXEL }));
  const page = await ctx.newPage();
  page.errors = [];
  page.requests = [];
  page.on("pageerror", e => page.errors.push(e.message));
  page.on("console", m => { if (m.type() === "error") page.errors.push(m.text()); });
  page.on("request", r => page.requests.push(r.url()));
  await page.goto(base + hash);
  return page;
}

/** Sign in as a guest and join Las Cimas, landing on the marketplace. */
async function joinAsGuest(page, zip = "78724") {
  await page.getByRole("button", { name: "Try it as a guest" }).click();
  await atHash(page, "community-setup");
  await page.getByPlaceholder("ZIP code").fill(zip);
  await page.getByRole("button", { name: /search/i }).click();
  await page.locator(".btn-sm.btn-primary").first().click();
  await atHash(page, "marketplace");
}

/** Wait for a client-side route (HashRouter changes don't fire a load event). */
function atHash(page, fragment) {
  return page.waitForFunction(f => location.hash.includes(f), fragment);
}

/** Go to a tab in the bottom nav. */
async function tab(page, name) {
  await page.locator(".bottom-nav button, nav button", { hasText: name }).first().click();
  await atHash(page, name.toLowerCase());
}

module.exports = { startServer, launch, openApp, joinAsGuest, atHash, tab };
