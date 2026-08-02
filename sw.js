/* Service worker — portál VŠE AED. Cachuje vše pro offline režim. */
const CACHE = 'vse-aed-v1';
const CORE = ["data/4mm110.json", "data/4es104.json", "data/4st102.json", "data/4dm201.json", "data/4st110.json", "data/44f102.json"];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(['./', './index.html'])).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(
    ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  e.respondWith(
    caches.match(req).then(hit => {
      if (hit) {
        fetch(req).then(r => { if (r && r.ok) caches.open(CACHE).then(c => c.put(req, r.clone())); }).catch(() => {});
        return hit;
      }
      return fetch(req).then(r => {
        if (r && r.ok) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); }
        return r;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
/* Předstažení všech předmětů na pozadí, aby fungoval offline režim celý. */
self.addEventListener('message', e => {
  if (e.data === 'prefetch') {
    caches.open(CACHE).then(c => CORE.forEach(u => c.add(u).catch(() => {})));
  }
});
