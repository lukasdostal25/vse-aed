/* Service worker: offline režim portálu statistiky. Maže jen své vlastní staré cache. */
const CACHE = 'stat-v1';
const FILES = ['promenne', 'sber', 'cv1', 'cv2', 'cv3', 'cv4', 'tahak', 'vycuc', 'trener', 'test'];
const SHELL = ['./', './index.html', './style.css', './app.js', './manifest.webmanifest', './data/datasets.json']
  .concat(FILES.map(f => './content/' + f + '.html'))
  .concat(['katex.min.css', 'katex.min.js', 'contrib/auto-render.min.js'].map(f => 'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/' + f));

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('stat-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.hostname === 'cdn.jsdelivr.net') {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
      if (r && (r.ok || r.type === 'opaque')) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); }
      return r;
    })));
    return;
  }
  if (url.origin !== location.origin) return;
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => {
    const net = fetch(req).then(r => {
      if (r && r.ok) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); }
      return r;
    }).catch(() => hit);
    return hit || net;
  }));
});
