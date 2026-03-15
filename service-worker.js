// Simple service worker for offline map tile caching
// and include a self‑destruct mechanism when running on localhost dev server.
// This prevents an old production build from remaining active during local
// development.  The SW will unregister itself immediately after activation
// on port 5173.

// Determine if we're running on the built‑in dev server
const IS_LOCAL_DEV =
  typeof self.location !== 'undefined' &&
  self.location.hostname === 'localhost' &&
  (self.location.port === '5173' || self.location.port === '5174');

const PRECACHE_NAME = 'static-assets-v4';

// We can't know the base path at build time, so compute it dynamically from the
// service worker's own scope (e.g. '/Map/' or '/Map/dev/').
const getBase = () => {
  try {
    return self.location.pathname.substring(0, self.location.pathname.lastIndexOf('/') + 1);
  } catch (e) {
    return '/';
  }
};

const BASE = getBase();

const PRECACHE_ASSETS = [
  BASE,
  // we intentionally *don't* cache index.html.  navigation requests are
  // left to the network so the inline unregister script always runs and we
  // never serve an old HTML blob that might re-install a stale worker.
  BASE + 'assets/icons/default.svg',
  BASE + 'assets/icons/glyph-marker-icon-blue.svg',
  BASE + 'assets/icons/glyph-marker-icon-gray.svg',
  BASE + 'assets/icons/glyph-marker-icon-green.svg',
  BASE + 'assets/icons/glyph-marker-icon-orange.svg',
  BASE + 'assets/icons/glyph-marker-icon-purple.svg',
  BASE + 'assets/icons/glyph-marker-icon-red.svg',
  BASE + 'assets/icons/glyph-marker-icon-yellow.svg',
  BASE + 'assets/icons/glyph-marker-icon-black.svg',
  BASE + 'assets/icons/marker-shadow.png',
  BASE + 'assets/logos/4x4Vakantiebeurs_FClogo_2026.png',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();

  if (IS_LOCAL_DEV) {
    // immediately activate then unregister ourselves
    return;
  }

  // Pre-cache essential icons and logo assets for offline/stable loading
  event.waitUntil(
    caches.open(PRECACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS).catch(() => {})),
  );
});

// During activation in dev we immediately unregister and clear caches.
self.addEventListener('activate', (event) => {
  if (IS_LOCAL_DEV) {
    event.waitUntil(
      self.registration
        .unregister()
        .then(() => caches.keys())
        .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
        .then(() => {})
        .catch(() => {}),
    );
    return; // skip normal logic below
  }
  self.clients.claim();
});
self.addEventListener('activate', () => {
  self.clients.claim();
});

// Cache Carto Voyager and Esri map tiles as well as local assets
self.addEventListener('fetch', (event) => {
  // NOTE: navigation requests include index.html (SPA shell).  we avoid
  // handling those so the browser always goes to the network; this prevents
  // the service worker from serving itself a cached copy of index.html which
  // would re-run an outdated unregister script and lead to the "steps back"
  // problem.  In local dev the worker itself is unregistered before it has a
  // chance to intercept navs, but this guard handles the case where a
  // production worker is still active on the GH Pages dev site.
  if (event.request.mode === 'navigate') {
    return; // let the browser do a normal network navigation
  }

  const url = event.request.url;
  // Helper for caching arbitrary requests in the "map-tiles" cache
  const cacheTile = () => {
    event.respondWith(
      caches.open('map-tiles').then((cache) =>
        cache.match(event.request).then((response) => {
          if (response) return response;
          // perform a network fetch; preserve original request mode (likely cors)
          // so that we don't get opaque responses for requests that need CORS (like Leaflet tiles with crossOrigin: true)
          return fetch(event.request)
            .then((networkResponse) => {
              // cache successful responses. For opaque (type='opaque'), only cache if we really meant to used no-cors.
              // But generally, map tiles should be CORS enabled.
              if (networkResponse && (networkResponse.ok || networkResponse.type === 'opaque')) {
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

  if (
    url.includes('cartodb-basemaps') ||
    url.includes('cartocdn.com') ||
    url.includes('arcgisonline.com/ArcGIS/rest/services/World_Imagery')
  ) {
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
