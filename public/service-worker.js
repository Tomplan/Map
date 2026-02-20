// Simple service worker for offline map tile caching
const PRECACHE_NAME = 'static-assets-v1';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/assets/icons/default.svg',
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
    caches.open(PRECACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS).catch(() => {})),
  );
});
self.addEventListener('activate', () => {
  self.clients.claim();
});

// Cache Carto Voyager and Esri map tiles as well as local assets
  self.addEventListener('fetch', (event) => {
    const url = event.request.url;
    // Helper for caching arbitrary requests in the "map-tiles" cache
    const cacheTile = () => {
      event.respondWith(
        caches.open('map-tiles').then((cache) =>
          cache.match(event.request).then((response) => {
            if (response) return response;
            // perform a network fetch; allow opaque responses (mode no-cors)
            return fetch(event.request, { mode: 'no-cors' })
              .then((networkResponse) => {
                if (networkResponse && (networkResponse.ok || networkResponse.type === 'opaque')) {
                  // we intentionally cache even opaque, since tiles are large and safe
                  cache.put(event.request, networkResponse.clone()).catch(() => {});
                }
                return networkResponse;
              })
              .catch(() => {
                // network failure - just let the request fall through
                return fetch(event.request);
              });
          }),
        ),
      );
    };

    if (url.includes('cartodb-basemaps') || url.includes('arcgisonline.com/ArcGIS/rest/services/World_Imagery')) {
      // intercept and cache cross-origin tile requests
      cacheTile();
      return;
    }

    // Cache marker icons and logos (same as before)
  if (url.match(/\/assets\/(icons|logos)\//)) {
    event.respondWith(
      caches.open('map-assets').then((cache) => {
        return cache.match(event.request).then((response) => {
          if (response) return response;

          // Fetch from network and only cache successful (status 200) responses.
          return fetch(event.request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.ok) {
                // Clone successful response to persist in cache
                cache.put(event.request, networkResponse.clone()).catch(() => {});
              }
              return networkResponse;
            })
            .catch(() => {
              // If network fetch fails, resolve with undefined so the browser can fallback as needed
              return undefined;
            });
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
    caches
      .keys()
      .then((keys) => Promise.all(keys.map((k) => (keep.includes(k) ? null : caches.delete(k))))),
  );
});
