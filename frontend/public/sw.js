// SERVICE WORKER - PWA CACHING FOR TDMU TRADE UNION PORTAL
const CACHE_NAME = 'tdmu-union-cache-v3';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/tin-tuc.html',
  '/co-cau-to-chuc.html',
  '/phuc-loi-doan-vien.html',
  '/van-ban.html',
  '/bieu-mau.html',
  '/lien-he.html',
  '/css/portal.css'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS_TO_CACHE).catch(() => {});
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // Bypass service worker for dynamic CMS APIs, admin pages, uploads, and streaming
  if (url.pathname.startsWith('/api/') || 
      url.pathname.includes('admin') || 
      url.pathname.startsWith('/uploads/') ||
      url.pathname.includes('autopilot')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .catch(async () => {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        return new Response('Network offline', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
      })
  );
});