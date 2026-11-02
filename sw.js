/* Rozcestník nic neukládá. Tento worker jen uklidí cache starého portálu z kořene webu a odregistruje se. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => {
  e.waitUntil(caches.delete('vse-aed-v1').then(() => self.registration.unregister()));
});
