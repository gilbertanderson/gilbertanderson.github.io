/*
  Nutrition Scanner VR view.
  Loaded only when the VR view is chosen. Works in Quest Browser (VR and passthrough) and in
  Chrome or Edge with PC VR (SteamVR, Quest Link, Air Link, Virtual Desktop).

  The scanner is a panel floating in front of you: a 2D canvas drawn as a texture on a plane.
  Controller rays (or hand pinches, which WebXR reports the same way) are cast at the plane,
  turned into canvas pixels, and matched against the buttons drawn on it.
  All data and decisions come from the app through the NutritionApp API.
*/
import * as THREE from "./vendor/three/three.module.js";

const W = 1024, H = 1408;                 // panel canvas, in pixels
const PANEL_W = 0.72, PANEL_H = PANEL_W * H / W;   // panel size, in meters (about 0.72 x 0.99)
const DISTANCE = 0.85;                    // meters in front of you

const C = {
  bg: "#121614", card: "#1b201d", line: "#33403a", ink: "#ffffff", muted: "#b9c4be",
  accent: "#6fbf95", accentInk: "#0f1a14", key: "#252b27", keyHover: "#33403a",
  ok: "#7fd3a3", caution: "#f0c062", avoid: "#ff9a8f", unknown: "#c8d0d6"
};
const VERDICT = { ok: "Fits", caution: "Fits with caution", avoid: "Doesn't fit", unknown: "Can't fully check" };
const SHORT = { ok: "Fits", caution: "Caution", avoid: "Doesn't fit", unknown: "Can't check" };

let app, renderer, scene, camera, panel, panelCanvas, ctx, texture, session = null;
let regions = [];          // [{ x, y, w, h, action }] drawn this frame
let hovered = new Map();   // controller -> action under its ray
let typed = "";
let status = "";           // "Looking up…", errors
let busy = false;
const controllers = [];
const raycaster = new THREE.Raycaster();
const tmpMatrix = new THREE.Matrix4();

export async function init(api) {
  app = api;
  const statusEl = document.getElementById("vrStatus");
  const vrBtn = document.getElementById("enterVR");
  const arBtn = document.getElementById("enterAR");
  const xr = navigator.xr;
  const [vr, ar] = xr
    ? await Promise.all(["immersive-vr", "immersive-ar"].map(m => xr.isSessionSupported(m).catch(() => false)))
    : [false, false];
  vrBtn.hidden = !vr;
  arBtn.hidden = !ar;
  statusEl.textContent = vr || ar
    ? "Ready. Put on your headset and choose how to enter."
    : "This browser can't open VR. Use Quest Browser on a Meta Quest, or Chrome or Edge on Windows with a PC VR headset connected (SteamVR, Quest Link, Air Link or Virtual Desktop).";
  vrBtn.onclick = () => start("immersive-vr");
  arBtn.onclick = () => start("immersive-ar");
}

async function start(mode) {
  if (session) return;
  const statusEl = document.getElementById("vrStatus");
  try {
    setup();
    session = await navigator.xr.requestSession(mode, { optionalFeatures: ["local-floor", "hand-tracking"] });
  } catch (e) {
    session = null;
    statusEl.textContent = "Couldn't start VR: " + (e && e.message ? e.message : "the headset refused the session") + ".";
    return;
  }
  scene.background = mode === "immersive-ar" ? null : new THREE.Color(C.bg);
  room.visible = mode !== "immersive-ar";
  renderer.xr.setReferenceSpaceType("local-floor");
  await renderer.xr.setSession(session);
  statusEl.textContent = mode === "immersive-ar" ? "In passthrough." : "In VR.";
  session.addEventListener("end", () => {
    session = null;
    renderer.setAnimationLoop(null);
    statusEl.textContent = "Back from VR. Your scans are here too.";
  });
  placed = false;
  redraw();
  renderer.setAnimationLoop(frame);
}

/* ---------- Scene ---------- */
let room, placed = false;
function setup() {
  if (renderer) return;
  const canvas = document.createElement("canvas");
  canvas.id = "xrCanvas";
  canvas.setAttribute("aria-hidden", "true");
  document.body.append(canvas);
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.xr.enabled = true;
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(70, 1, 0.05, 50);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x334433, 2.2));

  // A simple floor and horizon in VR so the panel has somewhere to sit (hidden in passthrough)
  room = new THREE.Group();
  const floor = new THREE.Mesh(new THREE.CircleGeometry(6, 48), new THREE.MeshBasicMaterial({ color: 0x1d2420 }));
  floor.rotation.x = -Math.PI / 2;
  room.add(floor, new THREE.GridHelper(12, 24, 0x3a4a40, 0x26302b));
  scene.add(room);

  panelCanvas = document.createElement("canvas");
  panelCanvas.width = W;
  panelCanvas.height = H;
  ctx = panelCanvas.getContext("2d");
  texture = new THREE.CanvasTexture(panelCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  panel = new THREE.Mesh(new THREE.PlaneGeometry(PANEL_W, PANEL_H), new THREE.MeshBasicMaterial({ map: texture, transparent: true }));
  scene.add(panel);

  for (let i = 0; i < 2; i++) {
    const c = renderer.xr.getController(i);
    const ray = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -1)]),
      new THREE.LineBasicMaterial({ color: 0x9fe8bf, transparent: true, opacity: 0.8 }));
    ray.scale.z = 2;
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.006, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    dot.visible = false;
    scene.add(dot);
    c.add(ray);
    c.userData = { ray, dot };
    c.addEventListener("select", () => press(c));
    c.addEventListener("connected", e => { ray.visible = true; c.userData.handedness = e.data && e.data.handedness; });
    c.addEventListener("disconnected", () => { ray.visible = false; dot.visible = false; hovered.delete(c); });
    scene.add(c);
    controllers.push(c);
  }
}

// Put the panel in front of where you're looking, level, at a comfortable height
function recenter() {
  const xrCam = renderer.xr.getCamera();
  const pos = new THREE.Vector3().setFromMatrixPosition(xrCam.matrixWorld);
  const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(new THREE.Quaternion().setFromRotationMatrix(xrCam.matrixWorld));
  dir.y = 0;
  if (dir.lengthSq() < 1e-6) dir.set(0, 0, -1);
  dir.normalize();
  const height = pos.y > 0.5 ? pos.y - 0.12 : 1.45;
  panel.position.set(pos.x + dir.x * DISTANCE, height, pos.z + dir.z * DISTANCE);
  panel.lookAt(pos.x, height, pos.z);
  placed = true;
}

function hitAction(controller) {
  tmpMatrix.identity().extractRotation(controller.matrixWorld);
  raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
  raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tmpMatrix);
  const hit = raycaster.intersectObject(panel, false)[0];
  const { ray, dot } = controller.userData;
  if (!hit || !hit.uv) { dot.visible = false; ray.scale.z = 2; return null; }
  dot.visible = true;
  dot.position.copy(hit.point);
  ray.scale.z = hit.distance;
  const x = hit.uv.x * W, y = (1 - hit.uv.y) * H;
  const r = regions.find(r => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h);
  return r ? r.action : null;
}

function frame() {
  if (!placed) recenter();
  let changed = false;
  for (const c of controllers) {
    const a = hitAction(c);
    if (hovered.get(c) !== a) { hovered.set(c, a); changed = true; }
  }
  if (changed) redraw();
  renderer.render(scene, camera);
}

/* ---------- Actions ---------- */
async function press(controller) {
  const action = hitAction(controller);
  if (!action || busy) return;
  const [kind, value] = action.split(":");
  if (kind === "key" && typed.length < 14) typed += value;
  else if (kind === "back") typed = typed.slice(0, -1);
  else if (kind === "clear") typed = "";
  else if (kind === "diet") app.selectDiet(value);
  else if (kind === "recent") { app.openRecent(value); status = ""; }
  else if (kind === "recenter") recenter();
  else if (kind === "exit") { session && session.end(); return; }
  else if (kind === "lookup") {
    if (!/^\d{6,14}$/.test(typed)) { status = "Enter the 8 to 14 digit number under the barcode."; redraw(); return; }
    busy = true;
    status = "Looking up " + typed + "…";
    redraw();
    const res = await app.lookup(typed);
    busy = false;
    status = res.ok ? "" : res.message;
    if (res.ok) typed = "";
  }
  pulse(controller);
  redraw();
}

function pulse(controller) {
  const src = session && [...session.inputSources].find(s => s.handedness === controller.userData.handedness) ;
  const gp = src && src.gamepad;
  if (gp && gp.hapticActuators && gp.hapticActuators[0]) gp.hapticActuators[0].pulse(0.3, 40).catch(() => {});
}

/* ---------- Drawing ---------- */
function roundRect(x, y, w, h, r, fill, stroke) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 3; ctx.stroke(); }
}
function text(str, x, y, size, color, weight = 400, align = "left") {
  ctx.font = `${weight} ${size}px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  ctx.fillText(str, x, y);
}
// Wrap text to a width; returns the lines (at most maxLines, last one shortened with …)
function wrap(str, width, size, weight = 400, maxLines = 2) {
  ctx.font = `${weight} ${size}px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`;
  const words = String(str).split(/\s+/);
  const lines = [];
  let line = "";
  for (const w of words) {
    const t = line ? line + " " + w : w;
    if (ctx.measureText(t).width <= width) line = t;
    else { if (line) lines.push(line); line = w; }
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    lines.length = maxLines;
    let last = lines[maxLines - 1];
    while (last.length && ctx.measureText(last + "…").width > width) last = last.slice(0, -1);
    lines[maxLines - 1] = last + "…";
  }
  return lines;
}
const isHover = action => [...hovered.values()].includes(action);
function button(x, y, w, h, label, action, opts = {}) {
  const hot = isHover(action);
  const fill = opts.selected ? C.accent : hot ? C.keyHover : (opts.fill || C.key);
  roundRect(x, y, w, h, 18, fill, hot ? C.ink : opts.stroke || null);
  text(label, x + w / 2, y + h / 2, opts.size || 40, opts.selected ? C.accentInk : (opts.color || C.ink), opts.weight || 600, "center");
  regions.push({ x, y, w, h, action });
}

function redraw() {
  if (!ctx) return;
  regions = [];
  roundRect(0, 0, W, H, 36, C.bg, C.line);

  // Header
  text("Nutrition Scanner", 36, 58, 44, C.ink, 700);
  button(W - 36 - 150, 22, 150, 72, "Exit", "exit", { size: 34 });
  button(W - 36 - 150 - 16 - 190, 22, 190, 72, "Recenter", "recenter", { size: 34 });

  // Diet choice
  const diets = app.diets().slice(0, 6);
  const gap = 12, dw = (W - 72 - gap * (diets.length - 1)) / diets.length;
  diets.forEach((d, i) => {
    const label = wrap(d.name, dw - 20, 32, 600, 1)[0];
    button(36 + i * (dw + gap), 116, dw, 76, label, "diet:" + d.id, { size: 32, selected: d.id === app.dietId() });
  });

  // Left: barcode entry
  const lx = 36, lw = 440;
  roundRect(lx, 216, lw, 96, 18, C.card, C.line);
  text(typed || "Barcode number", lx + 24, 264, typed ? 48 : 36, typed ? C.ink : C.muted, typed ? 700 : 400);
  const kw = (lw - 2 * 14) / 3, kh = 96;
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "⌫", "0", "Clear"];
  keys.forEach((k, i) => {
    const x = lx + (i % 3) * (kw + 14), y = 328 + Math.floor(i / 3) * (kh + 14);
    const action = k === "⌫" ? "back" : k === "Clear" ? "clear" : "key:" + k;
    button(x, y, kw, kh, k, action, { size: k === "Clear" ? 34 : 52 });
  });
  button(lx, 328 + 4 * (kh + 14), lw, 100, busy ? "Looking up…" : "Look up", "lookup", { selected: true, size: 44 });
  let ly = 328 + 4 * (kh + 14) + 100 + 22;
  if (status) {
    wrap(status, lw, 28, 400, 2).forEach(l => { text(l, lx, ly + 14, 28, C.caution); ly += 36; });
    ly += 8;
  }

  // Left, under the keypad: recent scans
  text("Recent scans", lx, ly + 18, 32, C.ink, 700);
  ly += 44;
  const recent = app.recent().slice(0, Math.max(1, Math.floor((H - 30 - ly) / 92)));
  if (!recent.length) wrap("Scans you look up show here, and open even offline.", lw, 26, 400, 3)
    .forEach(l => { text(l, lx, ly + 16, 26, C.muted); ly += 34; });
  for (const r of recent) {
    const hot = isHover("recent:" + r.code);
    roundRect(lx, ly, lw, 82, 16, hot ? C.keyHover : C.key, hot ? C.ink : null);
    text(wrap(r.name, lw - 40, 28, 700, 1)[0], lx + 20, ly + 28, 28, C.ink, 700);
    if (r.verdict) text(SHORT[r.verdict], lx + 20, ly + 60, 24, C[r.verdict], 700);
    regions.push({ x: lx, y: ly, w: lw, h: 82, action: "recent:" + r.code });
    ly += 92;
  }

  // Right: the result, full height
  const rx = 504, rw = W - rx - 36, rTop = 216, rBottom = H - 36;
  roundRect(rx, rTop, rw, rBottom - rTop, 22, C.card, C.line);
  const cur = app.current();
  if (!cur) {
    wrap("Type a barcode and choose Look up, or open a recent scan.", rw - 48, 34, 400, 4)
      .forEach((l, i) => text(l, rx + 24, rTop + 54 + i * 46, 34, C.muted));
  } else {
    let y = rTop + 46;
    wrap(cur.name, rw - 48, 42, 700, 2).forEach(l => { text(l, rx + 24, y, 42, C.ink, 700); y += 50; });
    if (cur.brand) { text(wrap(cur.brand, rw - 48, 30, 400, 1)[0], rx + 24, y, 30, C.muted); y += 44; }
    if (cur.verdict) {
      const col = C[cur.verdict];
      ctx.lineWidth = 4;
      roundRect(rx + 24, y, rw - 48, 84, 16, null, col);
      text(VERDICT[cur.verdict], rx + 48, y + 42, 42, col, 700);
      y += 112;
      const room = rBottom - 24 - (cur.warningsMissing ? 76 : 0);
      let shown = 0;
      for (const r of cur.reasons) {
        const need = 40 + (r.found.length ? 34 : 0) + (r.source ? 32 : 0) + 14;
        if (y + need > room - (cur.reasons.length - shown > 1 ? 40 : 0)) break;
        const tag = r.crossContact && r.level === "caution" ? "MAY CONTAIN" : r.level === "avoid" ? "AVOID" : "LIMIT";
        text(tag, rx + 24, y, 24, C[r.level === "avoid" ? "avoid" : "caution"], 700);
        ctx.font = `700 24px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`;
        const tagW = ctx.measureText(tag).width + 18;
        text(wrap(r.label, rw - 48 - tagW, 32, 700, 1)[0], rx + 24 + tagW, y, 32, C.ink, 700);
        y += 40;
        if (r.found.length) { text(wrap((r.crossContact ? "Shared equipment: " : "Found: ") + r.found.join(", "), rw - 48, 26, 400, 1)[0], rx + 24, y, 26, C.muted); y += 34; }
        if (r.source) { text(wrap("Source: " + r.source, rw - 48, 24, 400, 1)[0], rx + 24, y, 24, C.muted); y += 32; }
        y += 14;
        shown++;
      }
      if (cur.reasons.length > shown) {
        wrap(`+ ${cur.reasons.length - shown} more ${cur.reasons.length - shown === 1 ? "reason" : "reasons"}. See ${cur.reasons.length - shown === 1 ? "it" : "them"} on the page outside VR.`, rw - 48, 24, 400, 2)
          .forEach(l => { text(l, rx + 24, y, 24, C.muted); y += 30; });
      }
      if (cur.warningsMissing) wrap("Allergen warnings aren't listed. Check the label for \"may contain\".", rw - 48, 26, 400, 2)
        .forEach((l, i) => text(l, rx + 24, rBottom - 64 + i * 32, 26, C.caution));
    } else {
      text("Nutrition facts only (no diet chosen)", rx + 24, y + 20, 30, C.muted);
    }
  }

  if (texture) texture.needsUpdate = true;
}

// Test hook: the panel as an image and its buttons (used by the automated tests only)
window.__nutritionVR = {
  regions: () => regions.map(r => ({ ...r })),
  panel: () => panel,
  camera: () => renderer.xr.getCamera(),
  png: () => panelCanvas && panelCanvas.toDataURL("image/png"),
  active: () => Boolean(session)
};
