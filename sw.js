
const CACHE_NAME = 'moviehub-v1';
const ASSETS = [
  '/',
  '/index.html',
  'https://cdn.tailwindcss.com?plugins=forms,container-queries'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then(response => response || fetch(e.request))
  );
});
