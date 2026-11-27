// Section 508 / WCAG 2.x A and AA checks with axe-core on every main screen.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { startServer, launch, openApp, joinAsGuest, atHash, tab } = require("./helpers");
const AXE = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");

let srv, browser;
test.before(async () => { srv = await startServer(); browser = await launch(); });
test.after(async () => { await browser.close(); srv.server.close(); });

async function axe(page) {
  await page.waitForTimeout(400); // let toasts and transitions settle
  await page.addScriptTag({ content: AXE });
  const { violations } = await page.evaluate(() => axe.run(document, {
    runOnly: { type: "tag", values: ["section508", "wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }
  }));
  return violations.map(v => `${v.id}: ${v.help} → ${v.nodes.slice(0, 3).map(n => n.target.join(" ")).join(" | ")}`);
}

const STATES = {
  "sign in": async () => {},
  "sign up": async p => { await p.getByRole("button", { name: "Sign up" }).click(); },
  "community setup": async p => { await p.getByRole("button", { name: "Try it as a guest" }).click(); await atHash(p, "community-setup"); },
  "marketplace": async p => { await joinAsGuest(p); },
  "listing detail": async p => { await joinAsGuest(p); await p.locator(".listing-card").first().click(); await atHash(p, "listing/"); },
  "make offer sheet": async p => { await joinAsGuest(p); await p.locator(".listing-card").first().click(); await p.getByRole("button", { name: "Make Offer" }).click(); },
  "create listing sheet": async p => { await joinAsGuest(p); await p.getByRole("button", { name: /List/ }).first().click(); },
  "offers": async p => { await joinAsGuest(p); await tab(p, "Offers"); },
  "messages": async p => { await joinAsGuest(p); await tab(p, "Messages"); },
  "chat thread": async p => { await joinAsGuest(p); await tab(p, "Messages"); await p.getByText("Support Team").click(); await atHash(p, "messages/"); },
  "profile": async p => { await joinAsGuest(p); await tab(p, "Profile"); },
};

for (const [label, viewport] of [["phone", { width: 390, height: 844 }], ["desktop", { width: 1280, height: 900 }]]) {
  test(`axe: no violations on any screen, ${label}`, async () => {
    const problems = [];
    for (const [name, act] of Object.entries(STATES)) {
      const page = await openApp(browser, srv.base, { viewport, bypassCSP: true });
      await act(page);
      for (const v of await axe(page)) problems.push(`${name}: ${v}`);
      await page.context().close();
    }
    assert.deepEqual(problems, []);
  });
}

test("everything on the sign-in screen works from the keyboard", async () => {
  const page = await openApp(browser, srv.base);
  await page.getByRole("button", { name: "Try it as a guest" }).waitFor();
  await page.keyboard.press("Tab");
  const first = await page.evaluate(() => document.activeElement.textContent);
  assert.match(first, /Try it as a guest/);
  await page.keyboard.press("Enter");
  await atHash(page, "community-setup");
  await page.context().close();
});
