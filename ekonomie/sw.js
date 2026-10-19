/* Service worker — čtečka The Economy 2.0. Offline cache pro aplikaci, text i obrázky. */
const CACHE = 'econ-v8';
const SHELL = ['./', './index.html', './style.css', './app.js', './manifest.webmanifest', './data/toc.json', './data/cs/meta.json', './data/cs/titles.json', './data/portal.json',
  'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css',
  'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js',
  'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/auto-render.min.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const immutable = url.hostname === 'core-media.electricbook.works' || url.hostname === 'cdn.jsdelivr.net' || url.hostname === 'i.ytimg.com';
  if (immutable) {
    // obrázky a knihovny se nemění: cache-first
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
      if (r && (r.ok || r.type === 'opaque')) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); }
      return r;
    })));
    return;
  }
  if (url.origin !== location.origin) return;
  // vlastní soubory: stale-while-revalidate, aby šly aktualizace a zároveň offline
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => {
    const net = fetch(req).then(r => {
      if (r && r.ok) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); }
      return r;
    }).catch(() => hit || caches.match('./index.html'));
    return hit || net;
  }));
});
