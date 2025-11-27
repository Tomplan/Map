// Simple service worker for offline map tile caching
const PRECACHE_NAME = 'static-assets-v1';
const PRECACHE_ASSETS = [
  '/assets/icons/glyph-marker-icon-blue.svg',
  '/assets/icons/glyph-marker-icon-gray.svg',
  '/assets/icons/glyph-marker-icon-green.svg',
  '/assets/icons/glyph-marker-icon-orange.svg',
  '/assets/icons/glyph-marker-icon-purple.svg',
  '/assets/icons/glyph-marker-icon-red.svg',
  '/assets/icons/glyph-marker-icon-yellow.svg',
  '/assets/icons/glyph-marker-icon-black.svg',
  '/assets/icons/marker-shadow.png',
  '/assets/logos/4x4Vakantiebeurs.png',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  // Pre-cache essential icons and logo assets for offline/stable loading
  event.waitUntil(
    caches.open(PRECACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS).catch(() => {}))
  );
});
self.addEventListener('activate', () => {
  self.clients.claim();
});

// Cache Carto Voyager map tiles
self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  // Cache Carto Voyager tiles
  if (url.includes('cartodb-basemaps')) {
    event.respondWith(
      caches.open('map-tiles').then((cache) => {
        return cache.match(event.request).then((response) => {
          return (
            response ||
            fetch(event.request).then((networkResponse) => {
              cache.put(event.request, networkResponse.clone());
              return networkResponse;
            })
          );
        });
      }),
    );
    return;
  }
  // Cache Esri World Imagery tiles
  if (url.includes('arcgisonline.com/ArcGIS/rest/services/World_Imagery')) {
    event.respondWith(
      caches.open('map-tiles').then((cache) => {
        return cache.match(event.request).then((response) => {
          return (
            response ||
            fetch(event.request).then((networkResponse) => {
              cache.put(event.request, networkResponse.clone());
              return networkResponse;
            })
          );
        });
      }),
    );
    return;
  }
  // Cache marker icons and logos
  if (url.match(/\/assets\/(icons|logos)\//)) {
    event.respondWith(
      caches.open('map-assets').then((cache) => {
        return cache.match(event.request).then((response) => {
          return (
            response ||
            fetch(event.request).then((networkResponse) => {
              cache.put(event.request, networkResponse.clone());
              return networkResponse;
            })
          );
        });
      }),
    );
    return;
  }
});

// Cleanup old caches on activate (basic housekeeping)
self.addEventListener('activate', (event) => {
  const keep = [PRECACHE_NAME, 'map-assets', 'map-tiles'];
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.map((k) => (keep.includes(k) ? null : caches.delete(k)))
    ))
  );
});
