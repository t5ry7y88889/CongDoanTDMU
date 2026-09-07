// SERVICE WORKER - PWA CACHING FOR TDMU TRADE UNION PORTAL
const CACHE_NAME = 'tdmu-union-cache-v1';
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
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});