// SGRAIL 100 planner: offline copy for race morning.
// Only the planner and its icons are handled; every other page under /sgrail100/ (e.g. /planning) passes straight through.
const CACHE = 'sgrail100-plan-v1';
const PAGE = '/sgrail100/plan';
const ASSETS = [PAGE, '/sgrail100/plan.webmanifest', '/sgrail100/icons/icon-192.png', '/sgrail100/icons/icon-512.png', '/sgrail100/icons/apple-touch-icon.png'];
const OWN = new Set([PAGE, '/sgrail100/plan.html', ...ASSETS]);

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('sgrail100-plan-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin || !OWN.has(url.pathname)) return;
  const isPage = url.pathname === PAGE || url.pathname === '/sgrail100/plan.html';
  if (isPage) {
    // Network first so fixes arrive; fall back to the saved copy after 4 s or when offline.
    e.respondWith(new Promise(resolve => {
      let done = false;
      const fallback = () => caches.match(PAGE).then(r => { if (!done && r) { done = true; resolve(r); } });
      const timer = setTimeout(fallback, 4000);
      fetch(e.request).then(res => {
        clearTimeout(timer);
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(PAGE, copy)); }
        if (!done) { done = true; resolve(res); }
      }).catch(() => { clearTimeout(timer); caches.match(PAGE).then(r => { if (!done) { done = true; resolve(r || Response.error()); } }); });
    }));
  } else {
    e.respondWith(caches.match(url.pathname).then(r => r || fetch(e.request)));
  }
});
