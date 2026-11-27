// Share Crops (static demo) service worker: app-shell caching so the demo
// opens offline once visited. Scoped to /share-crops/ so it never touches the
// rest of gilbertanderson.com.
const CACHE = 'sharecrops-demo-v1';
const BASE = new URL('./', self.location).pathname; // "/share-crops/"
const SHELL = ['', 'index.html', 'offline.html', 'manifest.webmanifest', 'icon.svg', 'icon-192.png', 'icon-512.png'].map((p) => BASE + p);

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('sharecrops-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(BASE)) return;

  // Pages: network first so a new deploy shows up, cached shell when offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match(BASE + 'index.html').then((hit) => hit || caches.match(BASE + 'offline.html'))),
    );
    return;
  }

  // Hashed build assets and icons: cache first.
  event.respondWith(
    caches.match(request).then((hit) =>
      hit ||
      fetch(request).then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(request, copy));
        }
        return res;
      }),
    ),
  );
});
