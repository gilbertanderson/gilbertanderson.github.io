// VR view: driven in Meta's headset emulator (IWER) with a simulated Quest 3 and Meta VR Glasses.
// The test points a controller at the panel's buttons and pulls the trigger, like a person would.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { startServer, launch, fakeApis } = require("./helpers");

const IWER_JS = fs.readFileSync(require.resolve("iwer/build/iwer.min.js"), "utf8");
const SHOTS = process.env.VR_SHOTS;   // set to a folder to save what the panel looks like

let srv, browser;
test.before(async () => { srv = await startServer(); browser = await launch(); });
test.after(async () => { await browser.close(); srv.server.close(); });

async function openWithHeadset(profile, { products, emulate = true } = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, serviceWorkers: "block" });
  await fakeApis(ctx, products);
  if (emulate) {
    await ctx.addInitScript(IWER_JS);
    await ctx.addInitScript(p => {
      const device = new IWER.XRDevice(IWER[p]);
      device.installRuntime({ forceInstall: true });   // replace Chromium's own, which has no headset
      window.__xrDevice = device;
    }, profile);
  }
  const page = await ctx.newPage();
  page.problems = [];
  page.on("pageerror", e => page.problems.push(e.message));
  page.on("console", m => { if (/Content Security Policy|Refused/i.test(m.text())) page.problems.push(m.text()); });
  await page.goto(srv.base + "index.html");
  return page;
}

async function enterVR(page, which = "#enterVR") {
  await page.click('#viewSwitch button[data-view="vr"]');
  await page.waitForSelector(which + ":not([hidden])");
  await page.click(which);
  await page.waitForFunction(() => window.__nutritionVR && window.__nutritionVR.active());
  await page.waitForTimeout(300);
}

// Aim the right controller at a button on the panel and pull the trigger
async function press(page, action) {
  const ok = await page.evaluate(async action => {
    const vr = window.__nutritionVR, r = vr.regions().find(r => r.action === action);
    if (!r) return false;
    const panel = vr.panel();
    const W = 1024, H = 1408, PW = panel.geometry.parameters.width, PH = panel.geometry.parameters.height;
    const target = panel.position.clone().set((r.x + r.w / 2) / W * PW - PW / 2, PH / 2 - (r.y + r.h / 2) / H * PH, 0);
    panel.localToWorld(target);
    const ctrl = window.__xrDevice.controllers.right;
    const from = panel.position.clone().set(target.x + 0.15, target.y - 0.25, target.z + 0.45);
    const dir = target.clone().sub(from).normalize();
    const q = panel.quaternion.clone().setFromUnitVectors(panel.position.clone().set(0, 0, -1), dir);
    ctrl.position.set(from.x, from.y, from.z);
    ctrl.quaternion.set(q.x, q.y, q.z, q.w);
    await new Promise(res => setTimeout(res, 120));
    ctrl.updateButtonValue("trigger", 1);
    await new Promise(res => setTimeout(res, 120));
    ctrl.updateButtonValue("trigger", 0);
    await new Promise(res => setTimeout(res, 150));
    return true;
  }, action);
  assert.ok(ok, `no button for ${action} on the panel`);
}

async function shot(page, name) {
  if (!SHOTS) return;
  const png = await page.evaluate(() => window.__nutritionVR.png());
  fs.writeFileSync(path.join(SHOTS, name + ".png"), Buffer.from(png.split(",")[1], "base64"));
}

test("Quest 3: type a barcode in VR, look it up, and get the same verdict as the page", async () => {
  const page = await openWithHeadset("metaQuest3");
  await enterVR(page);
  await shot(page, "vr-start");
  for (const d of "12345678") await press(page, "key:" + d);
  await press(page, "lookup");
  await page.waitForFunction(() => window.NutritionApp.current());
  const cur = await page.evaluate(() => window.NutritionApp.current());
  assert.equal(cur.name, "Honey Oat Crackers");
  assert.equal(cur.verdict, "avoid");
  assert.match(await page.textContent(".verdict strong"), /Doesn't fit/);   // the page agrees
  assert.ok(cur.reasons.some(r => r.label === "Gluten" && /p\. 39/.test(r.source)));
  await shot(page, "vr-result");

  // Switch diet in VR: the page follows
  await press(page, "diet:vegan");
  assert.equal(await page.evaluate(() => document.querySelector("input[name=diet]:checked").value), "vegan");
  assert.equal(await page.evaluate(() => window.NutritionApp.current().verdict), "avoid");

  // Reopen from recent scans
  await press(page, "diet:best-bet");
  await press(page, "recent:12345678");
  assert.equal(await page.evaluate(() => window.NutritionApp.current().code), "12345678");
  assert.deepEqual(page.problems, []);
});

test("Quest 3: a bad barcode shows a message on the panel instead of looking it up", async () => {
  const page = await openWithHeadset("metaQuest3");
  await enterVR(page);
  for (const d of "12") await press(page, "key:" + d);
  await press(page, "lookup");
  assert.equal(await page.evaluate(() => window.NutritionApp.current()), null);
  await press(page, "exit");
  await page.waitForFunction(() => !window.__nutritionVR.active());
  assert.match(await page.textContent("#vrStatus"), /Back from VR/);
});

test("Quest 3 passthrough is offered and opens", async () => {
  const page = await openWithHeadset("metaQuest3");
  await enterVR(page, "#enterAR");
  assert.equal(await page.evaluate(() => window.__nutritionVR.active()), true);
  assert.deepEqual(page.problems, []);
});

test("Meta VR Glasses: the whole panel fits inside the narrower view", async () => {
  const page = await openWithHeadset("metaVRGlasses");
  await enterVR(page);
  const fit = await page.evaluate(() => {
    const vr = window.__nutritionVR, panel = vr.panel(), cam = vr.camera();
    const { width: PW, height: PH } = panel.geometry.parameters;
    const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy]) => panel.localToWorld(panel.position.clone().set(sx * PW / 2, sy * PH / 2, 0)));
    // Check against every eye's view: each corner must land inside the eye's view
    return cam.cameras.map(eye => corners.map(c => { const v = c.clone().project(eye); return Math.max(Math.abs(v.x), Math.abs(v.y)); }));
  });
  for (const eye of fit) for (const extent of eye) assert.ok(extent <= 0.95, `panel corner at ${extent.toFixed(2)} of the view`);
});

test("Without a headset, the VR view explains what it needs", async () => {
  const page = await openWithHeadset(null, { emulate: false });
  await page.click('#viewSwitch button[data-view="vr"]');
  await page.waitForFunction(() => !/Checking/.test(document.getElementById("vrStatus").textContent));
  assert.match(await page.textContent("#vrStatus"), /Quest Browser.*Chrome or Edge/s);
  assert.equal(await page.isVisible("#enterVR"), false);
  assert.deepEqual(page.problems, []);
});
