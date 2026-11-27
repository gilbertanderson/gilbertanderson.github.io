// Section 508 / WCAG 2.0-2.2 A and AA checks with axe-core, plus checks axe can't do on its own.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { startServer, launch, openApp, lookup } = require("./helpers");
const AXE = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");

let srv, browser;
test.before(async () => { srv = await startServer(); browser = await launch(); });
test.after(async () => { await browser.close(); srv.server.close(); });

async function axe(page) {
  await page.addScriptTag({ content: AXE });
  return page.evaluate(() => axe.run(document, {
    runOnly: { type: "tag", values: ["section508", "wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }
  }));
}

const STATES = {
  "start": async () => {},
  "about panel open": async p => { await p.click("#about summary"); },
  "manage panel open": async p => { await p.click("#manage summary"); },
  "result with a reason open": async p => { await lookup(p, "12345678"); await p.locator(".reasons details").first().click(); },
  "Diabetic result": async p => { await lookup(p, "12345678"); await p.click('label.chip:has-text("Diabetic")'); },
  "recent scans open": async p => { await lookup(p, "12345678"); await p.click("#recentPanel summary"); },
  "label check answered": async p => { await lookup(p, "87654321"); await p.click('#labelCheck label.chip:has-text("Soy")'); await p.click('[data-action="label-save"]'); },
  "not found": async p => { await lookup(p, "00000000"); },
  "invalid barcode": async p => { await lookup(p, "12"); },
  "VR view (no headset)": async p => { await p.click('#viewSwitch button[data-view="vr"]'); await p.waitForFunction(() => !/Checking/.test(document.getElementById("vrStatus").textContent)); }
};

for (const theme of ["light", "dark"]) for (const view of ["phone", "headset"]) {
  test(`axe: no violations, ${theme} theme, ${view} view`, async () => {
    const problems = [];
    for (const [name, act] of Object.entries(STATES)) {
      const page = await openApp(browser, srv.base, {
        theme, view, bypassCSP: true,   // so axe can be injected; CSP itself is tested in security.test.js
        viewport: view === "phone" ? { width: 390, height: 844 } : { width: 1280, height: 900 }
      });
      await act(page);
      const { violations } = await axe(page);
      for (const v of violations) problems.push(`${name}: ${v.id} (${v.impact}) ${v.nodes.map(n => n.target.join(" ")).slice(0, 3).join(", ")}`);
      await page.close();
    }
    assert.deepEqual(problems, []);
  });
}

test("keyboard: diet choice keeps focus; panels open with Enter", async () => {
  const page = await openApp(browser, srv.base);
  await page.focus("input[name=diet]:checked");
  await page.keyboard.press("ArrowRight");
  assert.equal(await page.evaluate(() => document.activeElement.value), "vegan");
  await page.focus("#about summary");
  await page.keyboard.press("Enter");
  assert.equal(await page.evaluate(() => document.getElementById("about").open), true);
});

test("focus moves to the result heading and status is announced", async () => {
  const page = await openApp(browser, srv.base);
  await lookup(page, "12345678");
  assert.equal(await page.evaluate(() => document.activeElement.tagName), "H2");
  await page.waitForFunction(() => /fit|check/i.test(document.getElementById("srStatus").textContent));
  assert.match(await page.textContent("#srStatus"), /Doesn't fit/);
});

test("reflow: no horizontal scrolling at 320px or with 200% text", async () => {
  for (const [width, big] of [[320, false], [640, true]]) {
    const page = await openApp(browser, srv.base, { viewport: { width, height: 800 } });
    if (big) await page.addStyleTag({ content: "html{font-size:200%} body{font-size:200% !important}" });
    await page.click("#manage summary");
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `width ${width}`);
  }
});

test("highlighted words don't rely on color alone", async () => {
  const page = await openApp(browser, srv.base);
  await lookup(page, "12345678");
  const marks = await page.locator(".ingredients mark").allTextContents();
  assert.ok(marks.length > 0);
  for (const m of marks) assert.match(m, /\((avoid|limit)\)$/);
});

test("case study page: no axe violations in either theme", async () => {
  for (const theme of ["light", "dark"]) {
    const page = await openApp(browser, srv.base, { theme, bypassCSP: true });
    await page.goto(srv.base + "case-study.html");
    const { violations } = await axe(page);
    assert.deepEqual(violations.map(v => v.id), [], theme);
    await page.close();
  }
});

test("Glasses view (600 x 600): no axe violations, fits without scrolling sideways", async () => {
  const problems = [];
  for (const name of ["start", "result with a reason open", "label check answered"]) {
    const page = await openApp(browser, srv.base, { view: "glasses", bypassCSP: true, viewport: { width: 600, height: 600 } });
    await STATES[name](page);
    const { violations } = await axe(page);
    for (const v of violations) problems.push(`${name}: ${v.id} ${v.nodes.map(n => n.target.join(" ")).slice(0, 3).join(", ")}`);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, name);
    await page.close();
  }
  assert.deepEqual(problems, []);
});
