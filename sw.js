// Cache First de los recursos de esta PWA. Sin async/await ni librerías.
const CACHE_PREFIX = 'mi-camara-pwa-';
const CACHE_NAME = CACHE_PREFIX + 'v2';
const APP_ASSETS = [
  './', './index.html', './styles.css', './app.js', './manifest.json',
  './icons/icon-192.png', './icons/icon-512.png'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(APP_ASSETS);
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (key) {
        return key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME;
      }).map(function (key) {
        return caches.delete(key);
      }));
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function (event) {
  const request = event.request;
  if (request.method !== 'GET') return;
  if (new URL(request.url).origin !== self.location.origin) return;

  event.respondWith(
    caches.match(request).then(function (cached) {
      if (cached) return cached;
      return fetch(request).then(function (response) {
        if (response.ok && response.type === 'basic') {
          const copy = response.clone();
          // event.waitUntil permite terminar el guardado incluso tras responder.
          event.waitUntil(caches.open(CACHE_NAME).then(function (cache) {
            return cache.put(request, copy);
          }));
        }
        return response;
      });
    })
  );
});
