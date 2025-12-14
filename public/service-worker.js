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

// Messages from the page to perform on-demand caching or store snapshots.
self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || !data.type) return;

  if (data.type === 'CACHE_URLS' && Array.isArray(data.urls)) {
    // Cache provided URLs defensively
    const cacheName = 'on-demand-cache';
    event.waitUntil(
      caches.open(cacheName).then((cache) =>
        Promise.all(
          data.urls.map((u) =>
            fetch(u)
              .then((res) => {
                if (res && res.ok) return cache.put(u, res.clone());
                return null;
              })
              .catch(() => null),
          ),
        ),
      ),
    );
  }

  if (data.type === 'STORE_SNAPSHOT' && data.snapshot) {
    const cacheName = PRECACHE_NAME;
    try {
      const body = JSON.stringify(data.snapshot || {});
      const response = new Response(body, { headers: { 'Content-Type': 'application/json' } });
      event.waitUntil(caches.open(cacheName).then((cache) => cache.put('/markers-snapshot', response)));
    } catch (e) {
      // ignore
    }
  }
});

// Cache Carto Voyager map tiles
self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  // Cache Carto Voyager tiles — but be defensive.
  // Many tile providers are cross-origin and fetches can fail or return opaque responses.
  // To avoid breaking the page we either let the network handle cross-origin tiles, or
  // if we attempt to cache them, don't throw on network failures and only cache good responses.
  if (url.includes('cartodb-basemaps')) {
    // Don't intercept / proxy cross-origin tile requests in the service worker by default.
    // Returning early lets the browser perform the network request (no extra risk of throwing
    // from the worker). This prevents a failing worker fetch from turning into a blank map.
    return;
  }
  // Cache Esri World Imagery tiles
  if (url.includes('arcgisonline.com/ArcGIS/rest/services/World_Imagery')) {
    // Similar to cartodb: avoid intercepting cross-origin imagery in the SW.
    return;
  }
  // Cache marker icons and logos
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
