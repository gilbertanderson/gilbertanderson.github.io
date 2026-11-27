/* =========================================================
   Nutrition Scanner
   Depends on: diets.js (DIETS, SOURCES), diet-check.js (evaluateDiet, termRegex)
   ========================================================= */
const $ = id => document.getElementById(id);
const result = $("result");
let currentProduct = null;
let currentCode = null;
let currentMeta = { origin: "off", fieldSources: {}, savedAt: null };
let selectedDietId = null;

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

/* ---------- Storage (per browser; always optional) ---------- */
const store = {
  get(key, fallback) { try { const v = localStorage.getItem(key); return v === null ? fallback : JSON.parse(v); } catch { return fallback; } },
  set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; } }
};
// Saved diets are re-validated at startup (see "Start"), never trusted as stored
let customDiets = [];
const allDiets = () => [...DIETS, ...customDiets];
const currentDiet = () => allDiets().find(d => d.id === selectedDietId) || DIETS[0];

/* ---------- Personal settings: "treat this limit as avoid for me" ---------- */
let overrides = {};   // { dietId: [rule label, ...] } (loaded and checked at startup)
const isOverridden = (dietId, label) => (overrides[dietId] || []).includes(label);
// The diet as this person uses it: their stricter settings applied on top of the source's rules
const TRACES_KEY = "__traces__";   // personal setting: treat cross-contact warnings as avoid
function effectiveDiet(d) {
  if (!(overrides[d.id] || []).length) return d;
  return { ...d, tracesAsAvoid: isOverridden(d.id, TRACES_KEY), rules: d.rules.map(r => {
    if (ruleLevel(r) !== "caution" || !isOverridden(d.id, r.label)) return r;
    const stricter = { ...r, level: "avoid", personal: true };
    if (r.type === "nutrient" && r.avoidAbove === undefined && r.cautionAbove !== undefined) stricter.avoidAbove = r.cautionAbove;
    return stricter;
  }) };
}
function setOverride(dietId, label, on) {
  const list = new Set(overrides[dietId] || []);
  on ? list.add(label) : list.delete(label);
  overrides[dietId] = [...list];
  store.set("overrides", overrides);
}

/* ---------- Sources ---------- */
const hasOwn = (obj, key) => obj != null && Object.prototype.hasOwnProperty.call(obj, key);
function resolveSource(diet, id) {
  if (hasOwn(diet.customSources, id)) return diet.customSources[id];
  return hasOwn(SOURCES, id) ? SOURCES[id] : undefined;
}
function dietSources(diet) {
  return (diet.sources || []).map(id => resolveSource(diet, id)).filter(Boolean);
}
// Only http(s) URLs ever become links or images
const safeUrl = u => (typeof u === "string" && /^https?:\/\//i.test(u.trim()) ? u.trim() : null);
const safeHttpsUrl = u => (typeof u === "string" && /^https:\/\//i.test(u.trim()) ? u.trim() : null);
function sourceLink(src, text) {
  const label = escapeHtml(text || src.title || "Source");
  const url = safeUrl(src.url);
  return url ? `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${label}<span class="sr-only"> (opens in a new tab)</span></a>` : label;
}
// e.g. "Best Bet Diet Cookbook, MS Hope, pages 41 and 15; How to read food labels, NHS"
function citeRule(diet, rule) {
  const byId = new Map();
  for (const s of rule.sources || []) {
    if (!resolveSource(diet, s.id)) continue;
    if (!byId.has(s.id)) byId.set(s.id, []);
    if (s.page) byId.get(s.id).push(s.page);
  }
  return [...byId].map(([id, pages]) =>
    sourceLink(resolveSource(diet, id)) +
    (pages.length ? escapeHtml(`, page${pages.length > 1 ? "s" : ""} ${pages.join(" and ")}`) : "")
  ).join("; ");
}

/* ---------- Diet picker ---------- */
const LEVEL_CLASS = { avoid: "v-avoid", caution: "v-caution", unknown: "v-unknown", ok: "v-ok" };
const LEVEL_WORD = { avoid: "Avoid", caution: "Limit" };
const ruleLevel = r => r.level || (r.avoidAbove !== undefined || r.max !== undefined ? "avoid" : "caution");

function renderDietChips() {
  const chip = d => `
    <label class="chip${d.custom ? " custom" : ""}">
      <input type="radio" name="diet" value="${escapeHtml(d.id)}" ${d.id === selectedDietId ? "checked" : ""}>
      <span>${escapeHtml(d.name.replace(" (nutrition facts only)", ""))}</span>
    </label>`;
  $("dietChips").innerHTML = `<legend>Diet</legend>` + allDiets().map(chip).join("");
}

// rebuild = true only when the list of diets changed; otherwise keep the native
// radios in place so keyboard focus stays on the diet the person just picked
function selectDiet(id, rebuild) {
  selectedDietId = allDiets().some(d => d.id === id) ? id : "best-bet";
  store.set("dietId", selectedDietId);
  if (rebuild) renderDietChips();
  renderDietInfo();
  renderRecent();
  if (currentProduct) {
    renderProduct(currentProduct, currentCode);
    announceVerdict();
  }
}

$("dietChips").addEventListener("change", e => {
  if (e.target.name === "diet") selectDiet(e.target.value, false);
});

function announce(text) {
  const el = $("srStatus");
  el.textContent = "";
  setTimeout(() => { el.textContent = text; }, 50);   // re-announce even when the text repeats
}
function announceVerdict() {
  const v = result.querySelector(".verdict strong");
  const n = result.querySelectorAll(".reasons > li").length;
  if (v) announce(`${v.textContent}. ${n ? n + (n === 1 ? " reason" : " reasons") + " listed." : ""}`);
}
const reduceMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const scrollToEl = (el, block) => el.scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block });

function renderDietInfo() {
  const d = currentDiet();
  $("dietInfo").textContent = d.rules.length
    ? (d.summary || "")
    : "Shows nutrition facts only, with no diet check.";
  renderAbout(d);
}

function renderAbout(d) {
  const about = $("about");
  if (!d.rules.length) { about.hidden = true; return; }
  about.hidden = false;
  const rules = [...d.rules].sort((a, b) => (ruleLevel(a) === "avoid" ? 0 : 1) - (ruleLevel(b) === "avoid" ? 0 : 1));
  const srcs = dietSources(d);
  const strictTraces = isOverridden(d.id, TRACES_KEY);
  $("aboutBody").innerHTML = `
    <div class="settings">
      <h3>Your settings</h3>
      <label class="toggle"><input type="checkbox" data-override="${TRACES_KEY}" ${strictTraces ? "checked" : ""}>
        <span>Treat "may contain" and shared-equipment warnings as avoid</span></label>
      <p class="hint">Off by default: the source doesn't cover cross-contact, so these show as a caution. You can also make any Limit rule below an avoid for you.</p>
    </div>
    <h3>Rules</h3>
    <ul class="rules">${rules.map(r => {
      const lvl = ruleLevel(r), cite = citeRule(d, r), mine = lvl === "caution" && isOverridden(d.id, r.label);
      return `<li>
        <span class="tag ${LEVEL_CLASS[mine ? "avoid" : lvl]}" data-tag-for="${escapeHtml(r.label)}">${mine ? "Avoid" : LEVEL_WORD[lvl]}</span><strong>${escapeHtml(r.label)}</strong>
        ${r.note ? `<div class="found">${escapeHtml(r.note)}</div>` : ""}
        ${bookListHtml(r, lvl)}
        ${cite ? `<div class="cite">Source: ${cite}</div>` : ""}
        ${lvl === "caution" ? `<label class="toggle"><input type="checkbox" data-override="${escapeHtml(r.label)}" ${mine ? "checked" : ""}>
          <span>Treat as avoid for me</span></label>` : ""}
      </li>`;
    }).join("")}</ul>
    ${srcs.length ? `<h3>Where this diet comes from</h3><ul class="srclist">${srcs.map(s =>
      `<li>${sourceLink(s)}${s.note ? `<div class="found">${escapeHtml(s.note)}</div>` : ""}</li>`).join("")}</ul>` : ""}`;
}

$("aboutBody").addEventListener("change", e => {
  const label = e.target.dataset.override;
  if (label === undefined) return;
  const d = currentDiet();
  setOverride(d.id, label, e.target.checked);
  // Update this rule's tag in place so focus stays on the checkbox
  const tag = [...$("aboutBody").querySelectorAll("[data-tag-for]")].find(t => t.dataset.tagFor === label);
  if (tag) { tag.className = "tag " + (e.target.checked ? "v-avoid" : "v-caution"); tag.textContent = e.target.checked ? "Avoid" : "Limit"; }
  if (currentProduct) renderProduct(currentProduct, currentCode);
  renderRecent();
  announce(label === TRACES_KEY
    ? `Shared-equipment warnings now count as ${e.target.checked ? "avoid" : "caution"}.`
    : `${label} is now ${e.target.checked ? "an avoid for you" : "back to limit"}.`);
});

function bookListHtml(rule, lvl) {
  if (!rule.bookList || !rule.bookList.length) return "";
  return `<div class="booklist"><span>${lvl === "avoid" ? "Avoid" : "Limit"}, as listed in the source:</span>
    <ul>${rule.bookList.map(x => `<li>${escapeHtml(x)}</li>`).join("")}</ul></div>`;
}

/* ---------- Sources section ---------- */
function renderSourcesSection() {
  const seen = new Map();
  const add = s => { if (s && !seen.has(s.title)) seen.set(s.title, s); };
  add(SOURCES.off);
  if (USDA.enabled()) add(SOURCES.usda);
  allDiets().forEach(d => dietSources(d).forEach(add));
  $("sourcesList").innerHTML = [...seen.values()].map(s =>
    `<li>${sourceLink(s)}${s.note ? `<div class="found">${escapeHtml(s.note)}</div>` : ""}</li>`).join("");
}

/* ---------- Scanning ---------- */
const scanner = new Html5Qrcode("reader", {
  formatsToSupport: [
    Html5QrcodeSupportedFormats.EAN_13,
    Html5QrcodeSupportedFormats.EAN_8,
    Html5QrcodeSupportedFormats.UPC_A,
    Html5QrcodeSupportedFormats.UPC_E
  ]
});
let scanning = false;
let cameras = [];
let cameraId = store.get("cameraId", null);

function setScanning(on) {
  scanning = on;
  $("startBtn").hidden = on;
  $("scanControls").hidden = !on;
  $("switchCamBtn").hidden = !(on && cameras.length > 1);
}

async function startScan() {
  if (scanning) return;
  // Headsets like Meta Quest expose several cameras (passthrough and selfie), so offer a switch
  try { cameras = await Html5Qrcode.getCameras(); } catch { cameras = []; }
  const useId = cameras.some(c => c.id === cameraId) ? cameraId : null;
  setScanning(true);
  try {
    await scanner.start(
      useId ? useId : { facingMode: "environment" },
      { fps: 10, qrbox: { width: 280, height: 150 } },
      async (code) => {
        if (navigator.vibrate) navigator.vibrate(80);
        await stopScan();
        lookup(code);
      }
    );
    announce("Camera on. Point it at a barcode.");
    scrollToEl($("reader"), "center");
  } catch (err) {
    setScanning(false);
    showMessage("Couldn't open the camera",
      "Allow camera access for this site in your browser settings, or type the barcode number instead.");
    focusResult();
  }
}

async function stopScan() {
  if (!scanning) return;
  try { await scanner.stop(); } catch { /* already stopped */ }
  setScanning(false);
  $("startBtn").focus();
}

$("startBtn").onclick = startScan;
$("stopBtn").onclick = stopScan;
$("switchCamBtn").onclick = async () => {
  if (cameras.length < 2) return;
  const i = cameras.findIndex(c => c.id === cameraId);
  cameraId = cameras.at((i + 1) % cameras.length).id;
  store.set("cameraId", cameraId);
  await stopScan();
  startScan();
};

/* ---------- Phone / Headset / Glasses view ---------- */
const isXRBrowser = /OculusBrowser|Quest|Pico|Wolvic/i.test(navigator.userAgent);
const VIEWS = ["phone", "headset", "glasses"];
function setView(view) {
  if (!VIEWS.includes(view)) view = "phone";
  document.body.classList.toggle("view-headset", view === "headset");
  document.body.classList.toggle("view-glasses", view === "glasses");
  document.querySelectorAll("#viewSwitch button").forEach(b =>
    b.setAttribute("aria-pressed", String(b.dataset.view === view)));
  store.set("view", view);
}
$("viewSwitch").addEventListener("click", e => {
  if (e.target.dataset.view) setView(e.target.dataset.view);
});
setView(store.get("view", isXRBrowser ? "headset" : "phone"));

// Hide the camera button on devices without a camera the page can use
// (e.g. Meta Ray-Ban Display web apps); typing or dictating the number still works
(async () => {
  let hasCamera = false;
  try {
    hasCamera = Boolean(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) &&
      (await navigator.mediaDevices.enumerateDevices()).some(d => d.kind === "videoinput");
  } catch { hasCamera = false; }
  if (!hasCamera) {
    $("startBtn").hidden = true;
    $("manual").placeholder = "Type or say the barcode number";
  }
})();

// Back returns from a result to the scan screen (browsers and the glasses' Back gesture)
function pushResultState(code) {
  try { history.pushState({ nsResult: code }, ""); } catch { /* history unavailable */ }
}
addEventListener("popstate", () => {
  if (!currentProduct && !result.querySelector("article")) return;
  currentProduct = null;
  result.innerHTML = `<div class="card empty-state"><h2>No product yet</h2><p class="meta">Scan a barcode or type its number, and the result shows here.</p></div>`;
  $("manual").focus();
});

/* ---------- Auto / Light / Dark theme ---------- */
function setTheme(theme) {
  if (theme === "light" || theme === "dark") document.documentElement.dataset.theme = theme;
  else { theme = "auto"; delete document.documentElement.dataset.theme; }   // follow the device
  document.querySelectorAll("#themeSwitch button").forEach(b =>
    b.setAttribute("aria-pressed", String(b.dataset.theme === theme)));
  store.set("theme", theme);
}
$("themeSwitch").addEventListener("click", e => {
  if (e.target.dataset.theme) setTheme(e.target.dataset.theme);
});
setTheme(store.get("theme", "dark"));   // dark until the visitor picks
$("manualForm").addEventListener("submit", e => {
  e.preventDefault();
  lookup($("manual").value.replace(/\D/g, ""));
});

/* ---------- Lookup ---------- */
const FIELDS = [
  "product_name", "brands", "serving_size", "image_front_small_url", "nutriments",
  "ingredients_text", "ingredients_text_en", "allergens_tags", "traces_tags",
  "additives_tags", "categories_tags", "ingredients_analysis_tags", "traces"
].join(",");

// Grocery barcodes: EAN-8, UPC-E (6-8), UPC-A (12), EAN-13, GTIN-14
const VALID_BARCODE = /^\d{6,14}$/;

async function fetchOff(code) {
  const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${code}.json?fields=${FIELDS}`,
    { credentials: "omit", referrerPolicy: "no-referrer" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Open Food Facts unavailable");
  const data = await res.json();
  return data && data.status === 1 && data.product && typeof data.product === "object" ? data.product : null;
}

async function lookup(raw) {
  const code = String(raw || "").replace(/\D/g, "");
  if (!VALID_BARCODE.test(code)) {
    showMessage("That doesn't look like a barcode", "Enter the 8 to 14 digit number printed under the barcode.");
    $("manual").setAttribute("aria-invalid", "true");
    $("manual").focus();
    announce("That doesn't look like a barcode. Enter the 8 to 14 digit number.");
    return;
  }
  $("manual").removeAttribute("aria-invalid");
  result.innerHTML = `<div class="card" aria-busy="true"><p class="meta">Looking up ${escapeHtml(code)}…</p>
    <div class="skeleton" style="width:60%"></div><div class="skeleton"></div><div class="skeleton" style="width:80%"></div></div>`;
  announce("Looking up product.");
  scrollToEl(result, "start");

  let product = null, fieldSources = {}, origin = "off", failed = false;
  try { product = await fetchOff(code); } catch { failed = true; }

  // Fill gaps from USDA when it's switched on and Open Food Facts is missing the product or its ingredients
  const missingIngredients = !product || !(product.ingredients_text || product.ingredients_text_en);
  if (missingIngredients && USDA.enabled()) {
    try {
      const food = await USDA.fetchFood(code);
      if (food) {
        const usda = USDA.toProduct(food);
        if (product) ({ product, fieldSources } = USDA.merge(product, usda));
        else { product = usda; origin = "usda"; failed = false; }
      }
    } catch { /* keep whatever Open Food Facts gave us */ }
  }

  if (!product) {
    const saved = findRecent(code);
    if (failed && saved) { openSaved(saved, true); return; }
    currentProduct = null;
    if (failed) showMessage("Lookup failed", "Check your connection and try again. Products you've scanned before still open from Recent scans while offline.", true);
    else showMessage(`No product found for ${code}`,
      `${USDA.enabled() ? "Neither Open Food Facts nor USDA has" : "Open Food Facts doesn't have"} this barcode yet. You can <a href="https://world.openfoodfacts.org/product/${code}" target="_blank" rel="noopener noreferrer">add it to Open Food Facts<span class="sr-only"> (opens in a new tab)</span></a> so it works next time, or check that the number is right.`,
      true);
    focusResult();
    return;
  }
  currentProduct = product;
  labelEditing = null;
  currentCode = code;
  currentMeta = { origin, fieldSources, savedAt: null };
  addRecent(code, product, currentMeta);
  renderProduct(product, code);
  pushResultState(code);
  focusResult();
  announceVerdict();
}

/* ---------- Recent scans (kept in this browser, so they open offline) ---------- */
const RECENT_MAX = 20;
let recent = [];
const NUTRIENT_KEY = /^(energy-kcal|fat|saturated-fat|trans-fat|carbohydrates|sugars|fiber|proteins|sodium)_(100g|serving)$/;

function compactProduct(p) {
  const out = {};
  for (const f of FIELDS.split(",")) {
    const v = p[f];
    if (typeof v === "string") out[f] = v.slice(0, 4000);
    else if (Array.isArray(v)) out[f] = v.filter(x => typeof x === "string").slice(0, 200).map(x => x.slice(0, 100));
  }
  out.nutriments = {};
  for (const [k, v] of Object.entries(p.nutriments || {})) {
    if (NUTRIENT_KEY.test(k) && Number.isFinite(Number(v)) && v !== "") out.nutriments[k] = Number(v);
  }
  return out;
}
function cleanRecent(list) {
  return (Array.isArray(list) ? list : []).filter(r =>
    r && typeof r.code === "string" && VALID_BARCODE.test(r.code) && r.product && typeof r.product === "object" && Number.isFinite(r.at)
  ).slice(0, RECENT_MAX).map(r => ({
    code: r.code, at: r.at, product: compactProduct(r.product),
    meta: { origin: r.meta && r.meta.origin === "usda" ? "usda" : "off",
            fieldSources: { ingredients: r.meta?.fieldSources?.ingredients === "usda" ? "usda" : undefined,
                            nutrition: ["usda", "both"].includes(r.meta?.fieldSources?.nutrition) ? r.meta.fieldSources.nutrition : undefined } }
  }));
}
const findRecent = code => recent.find(r => r.code === code);
function addRecent(code, product, meta) {
  recent = [{ code, at: Date.now(), product: compactProduct(product), meta: { origin: meta.origin, fieldSources: meta.fieldSources } },
            ...recent.filter(r => r.code !== code)].slice(0, RECENT_MAX);
  store.set("recent", recent);
  renderRecent();
}
function openSaved(entry, offline) {
  labelEditing = null;
  currentProduct = entry.product;
  currentCode = entry.code;
  currentMeta = { ...entry.meta, savedAt: entry.at, offline };
  renderProduct(currentProduct, currentCode);
  pushResultState(entry.code);
  focusResult();
  announceVerdict();
}
const shortDate = t => new Date(t).toLocaleDateString(undefined, { month: "short", day: "numeric" });

function renderRecent() {
  const panel = $("recentPanel");
  panel.hidden = recent.length === 0;
  $("recentCount").textContent = recent.length ? `(${recent.length})` : "";
  const diet = effectiveDiet(currentDiet());
  $("recentList").innerHTML = recent.map(r => {
    const v = diet.rules.length ? evaluateDiet(withLabelNote(r.product, r.code), diet).verdict : null;
    const word = { ok: "Fits", caution: "Caution", avoid: "Doesn't fit", unknown: "Can't check" }[v];
    return `<li><button type="button" class="recent-item" data-recent="${escapeHtml(r.code)}">
      <span class="recent-name">${escapeHtml(r.product.product_name || "Unnamed product")}</span>
      <span class="recent-meta">${r.product.brands ? escapeHtml(r.product.brands) + " · " : ""}${shortDate(r.at)}</span>
      ${v ? `<span class="tag ${LEVEL_CLASS[v]}">${word}</span>` : ""}
    </button></li>`;
  }).join("");
}
$("recentList").addEventListener("click", e => {
  const btn = e.target.closest("[data-recent]");
  if (!btn) return;
  const entry = findRecent(btn.dataset.recent);
  if (entry) openSaved(entry, false);
});
$("clearRecent").onclick = e => {
  if (!armButton(e.target, "Clear recent scans", "Tap again to clear your recent scans.")) return;
  recent = [];
  store.set("recent", recent);
  renderRecent();
  $("startBtn").focus();
  announce("Recent scans cleared.");
};

// Two-step confirm without a blocking dialog: first tap arms the button for 6 seconds
function armButton(btn, label, prompt) {
  if (btn.dataset.armed) { delete btn.dataset.armed; btn.textContent = label; return true; }
  btn.dataset.armed = "1";
  btn.textContent = "Tap again to confirm";
  announce(prompt);
  setTimeout(() => { if (btn.isConnected && btn.dataset.armed) { delete btn.dataset.armed; btn.textContent = label; } }, 6000);
  return false;
}

// Move keyboard and screen reader focus to the new result's heading
function focusResult() {
  const h = result.querySelector("h2");
  if (!h) return;
  h.setAttribute("tabindex", "-1");
  h.focus({ preventScroll: true });
}

function showMessage(title, html, withScanAgain) {
  result.innerHTML = `<div class="card"><h2>${escapeHtml(title)}</h2><p class="meta">${html}</p>
    ${withScanAgain ? `<div class="actions"><button class="secondary" data-action="scan">Scan another</button></div>` : ""}</div>`;
  announce(title);
}
result.addEventListener("click", e => {
  const action = e.target.closest("[data-action]") && e.target.closest("[data-action]").dataset.action;
  if (action === "label-save") {
    const traces = [...result.querySelectorAll("#labelCheck input:checked")].map(i => i.value).filter(t => LABEL_TAGS.has(t));
    if (!traces.length) { announce("Pick what the label lists, or choose No warning on the label."); result.querySelector("#labelCheck input").focus(); return; }
    saveLabelNote(currentCode, traces);
    return;
  }
  if (action === "label-none") { saveLabelNote(currentCode, []); return; }
  if (action === "label-change") {
    labelEditing = currentCode;
    renderProduct(currentProduct, currentCode);
    result.querySelector("#labelCheck input").focus();
    return;
  }
  if (e.target.dataset.action === "scan") startScan();
  if (e.target.dataset.action === "type") { $("manual").value = ""; $("manual").focus(); }
});

/* ---------- Result ---------- */
const VERDICT = {
  ok: ["✓", "Fits", "Nothing on the label conflicts with this diet."],
  caution: ["!", "Fits with caution", "Allowed, but has things this diet says to limit."],
  avoid: ["✕", "Doesn't fit", "Contains foods this diet excludes."],
  unknown: ["?", "Can't fully check", "This product has no ingredient list in Open Food Facts."]
};

function dietSection(product, evaluation) {
  const diet = effectiveDiet(currentDiet());
  if (!diet.rules.length) return "";
  const { verdict, results } = evaluation;
  let [icon, title, desc] = VERDICT[verdict];
  const flaggedAll = results.filter(r => r.level === verdict);
  if (verdict === "caution" && flaggedAll.length && flaggedAll.every(r => r.crossContact)) {
    desc = "No excluded ingredients, but it may contain traces of foods this diet excludes.";
  }
  if (verdict === "avoid" && flaggedAll.length && flaggedAll.every(r => r.crossContact)) {
    desc = "No excluded ingredients, but it may contain traces, and you've chosen to avoid those.";
  }

  const flagged = results
    .filter(r => r.level === "avoid" || r.level === "caution")
    .sort((a, b) => (a.level === "avoid" ? 0 : 1) - (b.level === "avoid" ? 0 : 1));

  const reasons = flagged.map(r => {
    const cite = citeRule(diet, r.rule);
    return `<li><details>
      <summary><span class="more" aria-hidden="true"></span><span class="tag ${LEVEL_CLASS[r.level]}">${r.crossContact && r.level === "caution" ? "May contain" : LEVEL_WORD[r.level]}</span><strong>${escapeHtml(r.rule.label)}</strong>${r.rule.personal ? ` <span class="mine">(your setting)</span>` : ""}
        ${r.found.length ? `<span class="found" style="display:block">${r.crossContact ? "Shared equipment or &quot;may contain&quot;" : "Found"}: ${r.found.map(escapeHtml).join(", ")}</span>` : ""}</summary>
      <div class="body">
        ${r.crossContact ? `<div class="found">It isn't an ingredient, but the product was made where it's handled, so traces are possible. The source doesn't cover cross-contact, so this is ${r.level === "avoid" ? "an avoid because of your setting" : "a caution; you can treat these as avoid in About this diet"}.</div>` : ""}
        ${r.rule.note ? `<div class="found">${escapeHtml(r.rule.note)}</div>` : ""}
        ${bookListHtml(r.rule, ruleLevel(r.rule))}
        ${cite ? `<div class="cite">Source: ${cite}</div>` : ""}
      </div></details></li>`;
  }).join("");

  const n = product.nutriments || {};
  const info = [];
  if (diet.dailySodiumCapMg && Number.isFinite(Number(n.sodium_serving)) && n.sodium_serving !== "") {
    const mg = Math.round(Number(n.sodium_serving) * 1000);
    info.push(`One serving has ${mg} mg sodium, about ${Math.round(mg / diet.dailySodiumCapMg * 100)}% of this diet's ${diet.dailySodiumCapMg.toLocaleString()} mg daily limit.`);
  }
  if (diet.showCarbsPerServing && Number.isFinite(Number(n.carbohydrates_serving)) && n.carbohydrates_serving !== "") {
    info.push(`One serving has ${+Number(n.carbohydrates_serving).toFixed(1)} g carbs` +
      (Number.isFinite(Number(n.fiber_serving)) && n.fiber_serving !== undefined ? ` and ${+Number(n.fiber_serving).toFixed(1)} g fiber` : "") +
      `. Compare it with your own per-meal carb target.`);
  }

  return `
    <div class="verdict ${LEVEL_CLASS[verdict]}">
      <span class="icon" aria-hidden="true"><b>${icon}</b></span>
      <div><strong>${title} · ${escapeHtml(diet.name)}</strong><small>${desc}</small></div>
    </div>
    ${reasons ? `<ul class="reasons">${reasons}</ul>` : ""}
    ${info.map(t => `<p class="info">${escapeHtml(t)}</p>`).join("")}`;
}

// Wrap matched words in <mark>, skipping exception phrases like "coconut milk"
function highlightIngredients(text, evaluation) {
  const ranges = [];
  const protectedRanges = crossContactRanges(text);
  for (const r of evaluation.results) {
    if (!r.matchedTerms || !r.matchedTerms.length) continue;
    for (const ex of r.rule.exceptions || []) {
      for (const m of text.matchAll(new RegExp(termRegex(ex).source, "gi"))) protectedRanges.push([m.index, m.index + m[0].length]);
    }
    for (const term of r.matchedTerms) {
      for (const m of text.matchAll(new RegExp(termRegex(term).source, "gi"))) {
        ranges.push({ start: m.index, end: m.index + m[0].length, level: r.level });
      }
    }
  }
  const isProtected = rg => protectedRanges.some(([s, e]) => rg.start >= s && rg.end <= e);
  // Longest and most severe first, then drop overlaps
  const kept = [];
  ranges.filter(rg => !isProtected(rg))
    .sort((a, b) => (a.level === "avoid" ? 0 : 1) - (b.level === "avoid" ? 0 : 1) || (b.end - b.start) - (a.end - a.start))
    .forEach(rg => { if (!kept.some(k => rg.start < k.end && rg.end > k.start)) kept.push(rg); });
  kept.sort((a, b) => a.start - b.start);

  let html = "", pos = 0;
  for (const k of kept) {
    html += escapeHtml(text.slice(pos, k.start)) + `<mark class="m-${k.level}">${escapeHtml(text.slice(k.start, k.end))}<span class="sr-only"> (${k.level === "avoid" ? "avoid" : "limit"})</span></mark>`;
    pos = k.end;
  }
  return { html: html + escapeHtml(text.slice(pos)), count: kept.length };
}

function dataSourceLine() {
  const m = currentMeta || {};
  const parts = [];
  if (m.origin === "usda") {
    parts.push(`Product data: ${sourceLink(SOURCES.usda)}. USDA doesn't list allergens, so checks rely on the ingredient list.`);
  } else {
    parts.push(`Product data: ${sourceLink(SOURCES.off)}.`);
    const f = m.fieldSources || {};
    if (f.ingredients === "usda") parts.push(`Ingredients from ${sourceLink(SOURCES.usda)}.`);
    if (f.nutrition === "usda") parts.push(`Nutrition facts from ${sourceLink(SOURCES.usda)}.`);
    if (f.nutrition === "both") parts.push(`Missing nutrition facts filled in from ${sourceLink(SOURCES.usda)}.`);
  }
  if (m.savedAt) parts.push(escapeHtml(`Saved scan from ${shortDate(m.savedAt)}${m.offline ? ". You're offline, so this may be out of date" : ""}.`));
  return parts.join(" ");
}

/* ---------- Label check: when the database doesn't list "may contain" warnings ---------- */
const LABEL_CHOICES = [
  ["en:milk", "Milk"], ["en:soybeans", "Soy"], ["en:gluten", "Wheat or gluten"], ["en:peanuts", "Peanuts"],
  ["en:nuts", "Tree nuts"], ["en:sesame-seeds", "Sesame"], ["en:eggs", "Eggs"], ["en:fish", "Fish"], ["en:crustaceans", "Shellfish"]
];
const LABEL_TAGS = new Set(LABEL_CHOICES.map(c => c[0]));
let labelNotes = {};          // { barcode: { traces: [tags], none: bool, at: time } } (checked at startup)
let labelEditing = null;      // barcode whose label check is open for changes

function cleanLabelNotes(raw) {
  const out = {};
  if (!raw || typeof raw !== "object") return out;
  for (const [code, n] of Object.entries(raw).slice(0, 500)) {
    if (!VALID_BARCODE.test(code) || !n || typeof n !== "object" || !Number.isFinite(n.at)) continue;
    const traces = Array.isArray(n.traces) ? n.traces.filter(t => LABEL_TAGS.has(t)) : [];
    out[code] = { traces, none: n.none === true && !traces.length, at: n.at };
  }
  return out;
}

// The product as the app should judge it: database data plus what you read on the label
function withLabelNote(p, code) {
  const note = labelNotes[code];
  if (!note || note.none || !note.traces.length) return p;
  return { ...p, traces_tags: [...new Set([...(Array.isArray(p.traces_tags) ? p.traces_tags : []), ...note.traces])] };
}

// "listed": the database has warnings; "user": you checked the label; "missing": nobody knows yet
function warningStatus(p, code) {
  if (labelNotes[code]) return "user";
  const hasText = typeof p.traces === "string" && p.traces.trim();
  return traceTags(p).length || hasText ? "listed" : "missing";
}

function labelCheckHtml(p, code) {
  const status = warningStatus(p, code);
  const note = labelNotes[code];
  const offLink = `<a href="https://world.openfoodfacts.org/product/${code}" target="_blank" rel="noopener noreferrer">add it to Open Food Facts<span class="sr-only"> (opens in a new tab)</span></a>`;
  if (status === "listed" && labelEditing !== code) return "";
  if (status === "user" && labelEditing !== code) {
    const names = note.traces.map(t => LABEL_CHOICES.find(c => c[0] === t)[1].toLowerCase());
    return `<div class="label-note" id="labelNote" tabindex="-1">
      <p><strong>From your label check</strong> (${escapeHtml(shortDate(note.at))}): ${note.none
        ? "no shared-equipment or &quot;may contain&quot; warning."
        : "may contain " + escapeHtml(names.join(", ")) + "."}</p>
      <div class="row-buttons">
        <button type="button" class="secondary" data-action="label-change">Change</button>
        ${!note.none ? `<a class="btn secondary" href="https://world.openfoodfacts.org/product/${code}" target="_blank" rel="noopener noreferrer">Add to Open Food Facts<span class="sr-only"> (opens in a new tab)</span></a>` : ""}
      </div>
      ${!note.none ? `<p class="hint">Adding the warning there fixes it for everyone who scans this product. It needs a free Open Food Facts account.</p>` : ""}
    </div>`;
  }
  const picked = new Set(note ? note.traces : []);
  return `<div class="label-check" id="labelCheck">
    <p><strong>Allergen warnings aren't listed for this product.</strong> The database has no &quot;may contain&quot; or shared-equipment information, so the result above can't account for it.</p>
    <fieldset class="chips">
      <legend class="label-q">Check the label. Does it say &quot;may contain&quot; or &quot;processed on equipment that also processes&quot; any of these?</legend>
      ${LABEL_CHOICES.map(([tag, name]) => `<label class="chip"><input type="checkbox" value="${tag}" ${picked.has(tag) ? "checked" : ""}><span>${name}</span></label>`).join("")}
    </fieldset>
    <div class="row-buttons">
      <button type="button" data-action="label-save">Save what the label says</button>
      <button type="button" class="secondary" data-action="label-none">No warning on the label</button>
    </div>
    <p class="hint">Saved for this barcode in this browser. If the label does have a warning, you can also ${offLink} so it's fixed for everyone.</p>
  </div>`;
}

function saveLabelNote(code, traces) {
  labelNotes[code] = { traces, none: traces.length === 0, at: Date.now() };
  store.set("labelNotes", labelNotes);
  labelEditing = null;
  renderProduct(currentProduct, currentCode);
  renderRecent();
  const note = $("labelNote");
  if (note) note.focus({ preventScroll: false });
  const v = result.querySelector(".verdict strong");
  announce(`Saved. ${v ? v.textContent + "." : ""}`);
}

function renderProduct(rawProduct, code) {
  const p = withLabelNote(rawProduct, code);
  const diet = effectiveDiet(currentDiet());
  const evaluation = evaluateDiet(p, diet);
  const n = p.nutriments || {};
  const rows = [
    ["Calories", "energy-kcal", 1, "kcal"], ["Fat", "fat", 1, "g"], ["Saturated fat", "saturated-fat", 1, "g"],
    ["Trans fat", "trans-fat", 1, "g"], ["Carbohydrates", "carbohydrates", 1, "g"], ["Sugars", "sugars", 1, "g"],
    ["Fiber", "fiber", 1, "g"], ["Protein", "proteins", 1, "g"], ["Sodium", "sodium", 1000, "mg"]
  ];
  const has = v => v !== undefined && v !== null && v !== "" && Number.isFinite(Number(v));
  const fmt = (v, scale) => (has(v) ? +(Number(v) * scale).toFixed(1) : "–");
  const hasServing = rows.some(([, key]) => has(n[key + "_serving"]));
  const shownRows = rows.filter(([, key]) => has(n[key + "_100g"]) || has(n[key + "_serving"]));
  const table = shownRows.map(([label, key, scale, unit]) => `
    <tr><td>${label} <span class="meta">(${unit})</span></td><td>${fmt(n[key + "_100g"], scale)}<span class="sr-only">${has(n[key + "_100g"]) ? "" : "not listed"}</span></td>
    ${hasServing ? `<td>${fmt(n[key + "_serving"], scale)}</td>` : ""}</tr>`).join("");

  const ingredients = p.ingredients_text_en || p.ingredients_text;
  const hl = ingredients ? highlightIngredients(ingredients, evaluation) : null;

  result.innerHTML = `
    <article class="card">
      <div class="product">
        ${safeHttpsUrl(p.image_front_small_url) ? `<img src="${escapeHtml(safeHttpsUrl(p.image_front_small_url))}" alt="" referrerpolicy="no-referrer">` : ""}
        <div>
          <h2>${escapeHtml(p.product_name || "Unnamed product")}</h2>
          <div class="meta">${p.brands ? escapeHtml(p.brands) + " · " : ""}Barcode ${escapeHtml(code)}</div>
        </div>
      </div>

      ${dietSection(p, evaluation)}
      ${currentDiet().rules.length ? labelCheckHtml(rawProduct, code) : ""}

      <h3>Ingredients</h3>
      ${hl ? `<p class="ingredients">${hl.html}</p>
        ${hl.count ? `<p class="legend" aria-hidden="true"><mark class="m-avoid">Avoid</mark> words are bold and underlined; <mark class="m-caution">limit</mark> words have a dotted underline.</p>` : ""}`
           : `<p class="meta">No ingredient list available.</p>`}

      <h3>Nutrition facts</h3>
      ${shownRows.length ? `<table>
        <caption class="sr-only">Nutrition facts per 100 grams${hasServing ? " and per serving" : ""}</caption>
        <thead><tr><th scope="col">Nutrient</th><th scope="col">Per 100 g</th>${hasServing ? `<th scope="col">Per serving${p.serving_size ? `<br>${escapeHtml(p.serving_size)}` : ""}</th>` : ""}</tr></thead>
        <tbody>${table}</tbody></table>` : `<p class="meta">No nutrition facts available.</p>`}

      <p class="cite">${dataSourceLine()}</p>
      <div class="actions">
        <button data-action="scan">Scan another</button>
        <button class="secondary" data-action="type">Type a barcode</button>
      </div>
    </article>`;
}

/* ---------- Manage diets: create, upload, download, delete ---------- */
function say(text, isError) {
  $("manageMsg").textContent = text;
  $("manageMsg").className = "msg" + (isError ? " err" : "");
}
const slug = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "diet";
const STR = v => typeof v === "string";
const STR_LIST = v => Array.isArray(v) ? v.filter(STR).map(s => s.trim()).filter(Boolean) : undefined;
const NUM = v => (typeof v === "number" && isFinite(v)) ? v : undefined;
const URL_OK = v => (safeUrl(v) ? safeUrl(v).slice(0, 500) : undefined);
const LIMITS = { fileBytes: 1_000_000, rules: 100, listItems: 300, itemChars: 160 };
const CAP_LIST = v => { const l = STR_LIST(v); return l && l.slice(0, LIMITS.listItems).map(x => x.slice(0, LIMITS.itemChars)); };

// Keep only fields the app understands, so an uploaded file can't inject anything else
// The inputs a diet was created from, kept so it can be edited in the same form
function cleanForm(f) {
  if (!f || typeof f !== "object") return undefined;
  const t = (v, n) => (STR(v) ? v.slice(0, n) : "");
  return { name: t(f.name, 40), source: t(f.source, 160), sourceUrl: URL_OK(f.sourceUrl) || "",
           avoid: t(f.avoid, 3000), limit: t(f.limit, 3000), sugar: t(f.sugar, 10), sodium: t(f.sodium, 10) };
}

// keepId: used when re-validating diets already saved in this browser
function cleanDiet(raw, keepId) {
  if (!raw || !STR(raw.name) || !Array.isArray(raw.rules)) throw new Error("A diet needs a name and a rules list.");

  const customSources = {};
  if (raw.customSources && typeof raw.customSources === "object") {
    for (const [key, s] of Object.entries(raw.customSources).slice(0, 20)) {
      if (s && STR(s.title)) customSources[slug(key)] = { title: s.title.slice(0, 160), url: URL_OK(s.url), note: STR(s.note) ? s.note.slice(0, 400) : undefined };
    }
  }
  if (raw.source && STR(raw.source.title)) {   // older single-source format
    customSources.main = { title: raw.source.title.slice(0, 160), url: URL_OK(raw.source.url) };
  }
  const known = id => hasOwn(customSources, id) || hasOwn(SOURCES, id);
  const fixId = id => (STR(id) ? (customSources[slug(id)] ? slug(id) : id) : null);

  const rules = raw.rules.slice(0, LIMITS.rules).map(r => {
    if (!r || !["ingredients", "nutrient"].includes(r.type)) return null;
    const level = ["avoid", "caution"].includes(r.level) ? r.level : undefined;
    const sources = Array.isArray(r.sources)
      ? r.sources.map(s => ({ id: fixId(s && s.id), page: s && STR(s.page) ? s.page.slice(0, 10) : undefined })).filter(s => s.id && known(s.id))
      : undefined;
    const base = { type: r.type, label: STR(r.label) ? r.label.slice(0, 80) : "Rule", note: STR(r.note) ? r.note.slice(0, 400) : undefined,
                   level, sources, bookList: CAP_LIST(r.bookList) };
    if (r.type === "ingredients") {
      return { ...base, level: level || "avoid", terms: CAP_LIST(r.terms), exceptions: CAP_LIST(r.exceptions),
               allergens: CAP_LIST(r.allergens), additives: CAP_LIST(r.additives), categories: CAP_LIST(r.categories),
               analysis: CAP_LIST(r.analysis), analysisCaution: CAP_LIST(r.analysisCaution) };
    }
    if (!STR(r.nutrient) || !/^[a-z0-9-]+_100g$/.test(r.nutrient)) return null;
    const ex = r.exemptIfOnly && typeof r.exemptIfOnly === "object" ? { terms: CAP_LIST(r.exemptIfOnly.terms), allow: CAP_LIST(r.exemptIfOnly.allow) } : undefined;
    return { ...base, exemptIfOnly: ex && ex.terms ? ex : undefined, nutrient: r.nutrient, unit: STR(r.unit) ? r.unit.slice(0, 8) : "g", scale: NUM(r.scale),
             max: NUM(r.max), cautionAbove: NUM(r.cautionAbove), avoidAbove: NUM(r.avoidAbove) };
  }).filter(Boolean);
  if (!rules.length) throw new Error("None of the rules in this file could be read.");

  let dietSourceIds = (Array.isArray(raw.sources) ? raw.sources : []).map(fixId).filter(id => id && known(id));
  if (!dietSourceIds.length) dietSourceIds = Object.keys(customSources);

  return {
    id: keepId && STR(raw.id) && /^custom-[a-z0-9-]{1,60}$/.test(raw.id) ? raw.id : "custom-" + slug(raw.name) + "-" + Date.now().toString(36),
    name: raw.name.slice(0, 40),
    summary: STR(raw.summary) ? raw.summary.slice(0, 300) : undefined,
    customSources, sources: dietSourceIds,
    dailySodiumCapMg: NUM(raw.dailySodiumCapMg),
    showCarbsPerServing: raw.showCarbsPerServing === true,
    form: cleanForm(raw.form),
    custom: true,
    rules
  };
}

function addDiets(list) {
  customDiets = [...customDiets, ...list];
  if (!store.set("customDiets", customDiets)) say("Saved for this visit only, because this browser is blocking storage.", true);
  selectDiet(list[0].id, true);
  renderDietList();
  renderSourcesSection();
}

$("dietFile").onchange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  if (file.size > LIMITS.fileBytes) { say("That file is over 1 MB, which is too large for a diet file.", true); e.target.value = ""; return; }
  try {
    const data = JSON.parse(await file.text());
    const list = (Array.isArray(data) ? data : [data]).slice(0, 20).map(d => cleanDiet(d));
    addDiets(list);
    say(`Added ${list.map(d => d.name).join(", ")} and switched to it.`);
  } catch (err) {
    say("Couldn't read that file. " + err.message, true);
  }
  e.target.value = "";
};

// Plain words people type that map to many label names
const EXPAND = {
  dairy: { allergens: ["en:milk"], terms: ["milk", "cheese", "butter", "cream", "yogurt", "yoghurt", "whey", "casein", "caseinate", "lactose", "ghee"],
           exceptions: ["coconut milk", "almond milk", "rice milk", "oat milk", "soy milk", "cocoa butter", "peanut butter", "almond butter", "cream of tartar", "dairy-free", "dairy free"] },
  milk: { allergens: ["en:milk"], terms: ["milk"], exceptions: ["coconut milk", "almond milk", "rice milk", "oat milk", "soy milk"] },
  gluten: { allergens: ["en:gluten"], terms: ["wheat", "rye", "barley", "spelt", "kamut", "triticale", "bulgur", "durum", "semolina", "malt"], exceptions: ["buckwheat"] },
  wheat: { allergens: ["en:gluten"], terms: ["wheat", "semolina", "durum", "spelt"], exceptions: ["buckwheat"] },
  soy: { allergens: ["en:soybeans"], terms: ["soy", "soya", "soybean", "tofu", "edamame", "miso", "tempeh"] },
  legumes: { allergens: ["en:soybeans", "en:peanuts", "en:lupin"], terms: ["bean", "pea", "lentil", "chickpea", "garbanzo", "peanut", "soy", "soya", "soybean", "tofu", "carob"],
             exceptions: ["vanilla bean", "coffee bean", "cocoa bean"] },
  peanuts: { allergens: ["en:peanuts"], terms: ["peanut"] },
  "tree nuts": { allergens: ["en:nuts"], terms: ["almond", "cashew", "walnut", "pecan", "hazelnut", "pistachio", "macadamia"] },
  eggs: { allergens: ["en:eggs"], terms: ["egg", "albumen"], exceptions: ["eggplant"] },
  fish: { allergens: ["en:fish"], terms: ["fish", "anchovy", "tuna", "salmon", "cod"] },
  shellfish: { allergens: ["en:crustaceans", "en:molluscs"], terms: ["shrimp", "crab", "lobster", "clam", "oyster", "mussel", "scallop"] },
  sesame: { allergens: ["en:sesame-seeds"], terms: ["sesame", "tahini"] },
  sugar: { terms: ["sugar", "cane sugar", "corn syrup", "high fructose corn syrup", "dextrose", "sucrose", "glucose syrup"] },
  "artificial sweeteners": { additives: ["en:e950", "en:e951", "en:e952", "en:e954", "en:e955", "en:e961", "en:e962"],
                             terms: ["aspartame", "sucralose", "acesulfame", "saccharin", "neotame", "advantame", "cyclamate"] },
  corn: { terms: ["corn", "maize", "cornstarch", "cornmeal", "corn syrup"] }
};
const splitList = text => text.split(/[,\n;•]+/).map(s => s.trim().toLowerCase()).filter(Boolean);

function listToRules(items, level, srcRef) {
  return items.map(item => {
    const known = EXPAND[item] || EXPAND[item.replace(/s$/, "")];
    const label = item.charAt(0).toUpperCase() + item.slice(1);
    return { type: "ingredients", level, label, sources: srcRef, bookList: [label], ...(known || { terms: [item] }) };
  });
}

let editingId = null;
const FORM_FIELDS = { fName: "name", fSource: "source", fSourceUrl: "sourceUrl", fAvoid: "avoid", fLimit: "limit", fSugar: "sugar", fSodium: "sodium" };

function startEdit(diet) {
  editingId = diet.id;
  for (const [id, key] of Object.entries(FORM_FIELDS)) $(id).value = diet.form[key] || "";
  $("createBtn").textContent = "Save changes";
  $("cancelEditBtn").hidden = false;
  $("formHeading").textContent = `Editing ${diet.name}`;
  $("manage").open = true;
  $("fName").focus();
  say(`Editing ${diet.name}. Change anything, then save.`);
}
function endEdit() {
  editingId = null;
  Object.keys(FORM_FIELDS).forEach(id => $(id).value = "");
  $("createBtn").textContent = "Save diet";
  $("cancelEditBtn").hidden = true;
  $("formHeading").textContent = "Create a diet from a cookbook or plan";
}
$("cancelEditBtn").onclick = () => { endEdit(); say("Editing canceled."); $("fName").focus(); };

$("createBtn").onclick = () => {
  const val = id => $(id).value.trim();
  const name = val("fName");
  if (!name) { say("Give the diet a name.", true); $("fName").focus(); return; }
  const avoid = splitList(val("fAvoid")), limit = splitList(val("fLimit"));
  const sugar = parseFloat(val("fSugar")), sodium = parseFloat(val("fSodium"));
  const srcTitle = val("fSource"), srcUrl = val("fSourceUrl");
  const srcRef = srcTitle || srcUrl ? [{ id: "main" }] : undefined;

  const rules = [...listToRules(avoid, "avoid", srcRef), ...listToRules(limit, "caution", srcRef)];
  if (!isNaN(sugar)) rules.push({ type: "nutrient", label: "Sugar", nutrient: "sugars_100g", unit: "g", avoidAbove: sugar, cautionAbove: sugar / 2, sources: srcRef });
  if (!isNaN(sodium)) rules.push({ type: "nutrient", label: "Sodium", nutrient: "sodium_100g", unit: "mg", scale: 1000, avoidAbove: sodium, cautionAbove: sodium / 2, sources: srcRef });
  if (!rules.length) { say("Add at least one food to avoid or limit, or a sugar or sodium limit.", true); $("fAvoid").focus(); return; }

  try {
    const form = Object.fromEntries(Object.entries(FORM_FIELDS).map(([id, key]) => [key, val(id)]));
    const diet = cleanDiet({
      id: editingId, name, rules, form,
      summary: [avoid.length && "Avoid: " + avoid.join(", "), limit.length && "Limit: " + limit.join(", ")].filter(Boolean).join(". ") + ".",
      customSources: srcRef ? { main: { title: srcTitle || srcUrl, url: srcUrl } } : undefined,
      sources: srcRef ? ["main"] : []
    }, Boolean(editingId));
    if (editingId) {
      customDiets = customDiets.map(d => (d.id === editingId ? diet : d));
      store.set("customDiets", customDiets);
      selectDiet(diet.id, true);
      renderDietList();
      renderSourcesSection();
      say(`Saved changes to ${diet.name}.`);
      endEdit();
    } else {
      addDiets([diet]);
      endEdit();
      say(`Saved ${diet.name} and switched to it.`);
    }
  } catch (err) {
    say(err.message, true);
  }
};

function downloadDiet(diet) {
  // Bundle the sources it cites so the file stands on its own
  const ids = new Set([...(diet.sources || []), ...diet.rules.flatMap(r => (r.sources || []).map(s => s.id))]);
  const customSources = {};
  ids.forEach(id => { const s = resolveSource(diet, id); if (s) customSources[id] = s; });
  const { id, custom, ...data } = diet;
  const blob = new Blob([JSON.stringify({ ...data, customSources }, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = slug(diet.name) + ".json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function renderDietList() {
  $("dietList").innerHTML = allDiets().filter(d => d.rules.length).map(d => `
    <li>
      <span>${escapeHtml(d.name)} ${d.custom ? '<span class="mine">(yours)</span>' : ""}</span>
      <button class="secondary" data-dl="${escapeHtml(d.id)}" aria-label="Download ${escapeHtml(d.name)}">Download</button>
      ${d.custom && d.form ? `<button class="secondary" data-edit="${escapeHtml(d.id)}" aria-label="Edit ${escapeHtml(d.name)}">Edit</button>` : ""}
      ${d.custom ? `<button class="secondary" data-del="${escapeHtml(d.id)}" aria-label="Delete ${escapeHtml(d.name)}">Delete</button>` : ""}
    </li>`).join("");
}

$("dietList").onclick = (e) => {
  const { dl, del, edit } = e.target.dataset;
  if (dl) downloadDiet(allDiets().find(d => d.id === dl));
  if (edit) startEdit(customDiets.find(d => d.id === edit));
  if (del) {
    const d = customDiets.find(x => x.id === del);
    if (!armButton(e.target, "Delete", `Tap again to delete ${d.name}.`)) return;
    if (editingId === del) endEdit();
    delete overrides[del]; store.set("overrides", overrides);
    customDiets = customDiets.filter(x => x.id !== del);
    store.set("customDiets", customDiets);
    selectDiet(selectedDietId === del ? "best-bet" : selectedDietId, true);
    $("manage").querySelector("summary").focus();
    renderDietList();
    renderSourcesSection();
    say(`Deleted ${d.name}.`);
  }
};

/* ---------- Start ---------- */
// Re-validate saved diets: storage could hold old-format or tampered data
customDiets = (Array.isArray(store.get("customDiets", [])) ? store.get("customDiets", []) : []).flatMap(d => {
  try { return [cleanDiet(d, true)]; } catch { return []; }
});
store.set("customDiets", customDiets);
const savedOverrides = store.get("overrides", {});
for (const d of allDiets()) {
  const list = savedOverrides && Array.isArray(savedOverrides[d.id]) ? savedOverrides[d.id].filter(STR).slice(0, 100) : [];
  if (list.length) overrides[d.id] = list;
}
recent = cleanRecent(store.get("recent", []));
labelNotes = cleanLabelNotes(store.get("labelNotes", {}));
store.set("labelNotes", labelNotes);
selectDiet(store.get("dietId", "best-bet"), true);
renderDietList();
renderSourcesSection();

// Installable app + offline: register the service worker (needs https or localhost)
if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
  addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
}
