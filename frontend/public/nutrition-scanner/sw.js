/*
  Nutrition Scanner service worker.
  Caches the app's own files so it opens offline and installs as an app.
  Product lookups (Open Food Facts, USDA) are never cached here; recent
  scans are kept by the app itself so they still open offline.

  Bump VERSION whenever any app file changes, so visitors get the update.
*/
const VERSION = "ns-v4";
const SHELL = [
  "./",
  "index.html",
  "app.js",
  "diets.js",
  "diet-check.js",
  "config.js",
  "usda.js",
  "vendor/html5-qrcode.min.js",
  "xr-view.js",
  "vendor/three/three.module.js",
  "vendor/three/three.core.js",
  "manifest.webmanifest",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-512.png",
  "icons/apple-touch-icon.png"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(VERSION).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith("ns-") && k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Same-origin files: serve from cache right away, refresh the cache in the background.
// Everything else (product APIs, images) goes straight to the network.
self.addEventListener("fetch", event => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== self.location.origin) return;
  if (url.pathname.endsWith("/sw.js")) return;

  event.respondWith(
    caches.open(VERSION).then(async cache => {
      const cached = await cache.match(req, { ignoreSearch: true });
      const fresh = fetch(req)
        .then(res => { if (res.ok && res.type === "basic") cache.put(req, res.clone()); return res; })
        .catch(() => null);
      if (cached) { event.waitUntil(fresh); return cached; }
      const res = await fresh;
      if (res) return res;
      // Offline and not cached: fall back to the app page for navigations
      if (req.mode === "navigate") return cache.match("index.html");
      return new Response("Offline", { status: 503, statusText: "Offline" });
    })
  );
});
