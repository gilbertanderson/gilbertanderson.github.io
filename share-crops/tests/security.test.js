// Security checks: CSP, no third-party calls, script injection, and storage hygiene.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { startServer, launch, openApp, joinAsGuest, atHash, tab } = require("./helpers");

let srv, browser;
test.before(async () => { srv = await startServer(); browser = await launch(); });
test.after(async () => { await browser.close(); srv.server.close(); });

test("the build ships a strict Content Security Policy", () => {
  const html = fs.readFileSync(path.join(__dirname, "../dist/index.html"), "utf8");
  const csp = (html.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/) || [])[1];
  assert.ok(csp, "CSP meta tag present");
  assert.match(csp, /default-src 'self'/);
  assert.match(csp, /script-src 'self'(;|$)/, "no inline or remote scripts");
  assert.match(csp, /object-src 'none'/);
  assert.match(csp, /base-uri 'none'/);
  assert.match(csp, /connect-src 'self'/, "no fetches to other hosts");
  assert.doesNotMatch(html, /<script(?![^>]*\bsrc=)[^>]*>/, "no inline scripts in the page");
});

test("a whole session talks to nobody but this site (and the listing photo CDN)", async () => {
  const page = await openApp(browser, srv.base);
  await joinAsGuest(page);
  await page.locator(".listing-card").first().click();
  await atHash(page, "listing/");
  await page.getByRole("button", { name: /back/i }).click();
  for (const t of ["Offers", "Messages", "Profile", "Market"]) await tab(page, t);
  const hosts = new Set(page.requests.map(u => new URL(u).origin));
  hosts.delete(new URL(srv.base).origin);
  hosts.delete("https://images.unsplash.com");
  assert.deepEqual([...hosts], [], "no fonts, analytics or APIs from other origins");
  assert.deepEqual(page.errors, []);
  await page.context().close();
});

test("script in a chat message or listing is shown as text, never run", async () => {
  const page = await openApp(browser, srv.base);
  await joinAsGuest(page);
  await page.evaluate(() => { window.__pwned = 0; });
  const payload = `<img src=x onerror="window.__pwned=1">"><script>window.__pwned=2</script>`;

  await page.getByRole("button", { name: /List/ }).first().click();
  await page.getByPlaceholder("e.g., Fresh Tomatoes").fill(`Pears ${payload}`);
  await page.getByPlaceholder("10 lbs").fill("3 lbs");
  await page.getByPlaceholder("Tell others about it…").fill(payload);
  await page.locator(".modal-sheet button.btn-primary").last().click();
  await page.locator(".listing-card", { hasText: "Pears" }).first().click();
  await atHash(page, "listing/");
  await tab(page, "Messages").catch(async () => { await page.getByRole("button", { name: /back/i }).click(); await tab(page, "Messages"); });
  await page.getByText("Support Team").click();
  await page.getByPlaceholder(/Message/).fill(payload);
  await page.getByPlaceholder(/Message/).press("Enter");
  await page.getByText(/img src=x/).waitFor();
  await page.waitForTimeout(500);
  assert.equal(await page.evaluate(() => window.__pwned), 0);
  assert.equal(await page.locator("img[src='x'], script:has-text('__pwned')").count(), 0);
  await page.context().close();
});

test("non-image uploads are refused", async () => {
  const page = await openApp(browser, srv.base);
  await joinAsGuest(page);
  await page.getByRole("button", { name: /List/ }).first().click();
  await page.locator(".modal-sheet input[type=file]").setInputFiles({ name: "evil.svg", mimeType: "image/svg+xml", buffer: Buffer.from("<svg onload=alert(1)>") });
  await page.getByText(/JPEG, PNG, WebP or GIF/).waitFor();
  assert.equal(await page.locator(".modal-sheet img").count(), 0);
  await page.context().close();
});

test("the service worker is scoped to /share-crops/ only", () => {
  const sw = fs.readFileSync(path.join(__dirname, "../dist/sw.js"), "utf8");
  assert.match(sw, /startsWith\(BASE\)/, "ignores requests outside the app folder");
  assert.match(sw, /url\.origin !== self\.location\.origin/, "ignores other origins");
  const src = fs.readFileSync(path.join(__dirname, "../src/lib/serviceWorker.ts"), "utf8");
  assert.match(src, /scope: import\.meta\.env\.BASE_URL/);
});
