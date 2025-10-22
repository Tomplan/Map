
// Simple service worker for offline map tile caching
self.addEventListener('install', event => {
  self.skipWaiting();
});
self.addEventListener('activate', event => {
  self.clients.claim();
});

// Cache Carto Voyager map tiles
self.addEventListener('fetch', event => {
  const url = event.request.url;
  if (url.includes('cartodb-basemaps')) {
    event.respondWith(
      caches.open('map-tiles').then(cache => {
        return cache.match(event.request).then(response => {
          return response || fetch(event.request).then(networkResponse => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        });
      })
    );
  }
});
