import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst } from 'workbox-strategies';

// Precache static assets (Vite injects manifest)
precacheAndRoute(self.__WB_MANIFEST || []);

// Cache map tiles from Carto Voyager
registerRoute(
  ({url}) => url.origin.includes('cartodb-basemaps'),
  new CacheFirst({
    cacheName: 'map-tiles',
    plugins: []
  })
);

// Activate new SW immediately
self.addEventListener('install', event => {
  self.skipWaiting();
});
self.addEventListener('activate', event => {
  self.clients.claim();
});
