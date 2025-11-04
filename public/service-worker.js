// Simple service worker for offline map tile caching
self.addEventListener('install', () => {
  self.skipWaiting();
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
