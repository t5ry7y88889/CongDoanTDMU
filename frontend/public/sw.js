// SERVICE WORKER - PWA CACHING FOR TDMU TRADE UNION SPA PORTAL
const CACHE_NAME = 'tdmu-union-cache-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/tin-tuc',
  '/bai-viet',
  '/co-cau-to-chuc',
  '/phuc-loi-doan-vien',
  '/van-ban',
  '/bieu-mau',
  '/lien-he',
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
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});