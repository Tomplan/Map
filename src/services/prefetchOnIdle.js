import { getMarkerSnapshot } from './idbCache';

function postMessageToSW(message) {
  if (navigator.serviceWorker && navigator.serviceWorker.controller) {
    try {
      navigator.serviceWorker.controller.postMessage(message);
    } catch (e) {
      // ignore
    }
  }
}

export function scheduleMapPrefetchOnIdle(opts = {}) {
  const { immediate = false } = opts;
  const doPrefetch = async () => {
    try {
      // Persist current marker snapshot into SW cache for offline use
      const snapshot = await getMarkerSnapshot();
      if (snapshot) {
        postMessageToSW({ type: 'STORE_SNAPSHOT', snapshot });
      }

      // Dynamically import the EventMap inner chunk to let the browser fetch and cache it
      // We intentionally don't attach it to the DOM; this warms the network cache and
      // ensures the chunk is available offline if the service worker caches it or if
      // it's present in HTTP cache.
      // eslint-disable-next-line no-unused-vars, import/no-cycle
      await import('../components/EventMap/EventMapInner');

      // Optionally, tell the service worker to cache specific known asset URLs (CSS/images)
      postMessageToSW({
        type: 'CACHE_URLS',
        urls: [
          '/assets/icons/glyph-marker-icon-blue.svg',
          '/assets/icons/marker-shadow.png',
          '/assets/logos/4x4Vakantiebeurs.png',
        ],
      });
    } catch (err) {
      // prefetch failed; ignore
    }
  };

  if (immediate || (typeof process !== 'undefined' && process.env && process.env.JEST_WORKER_ID)) {
    // Run immediately (useful for tests) or when explicitly requested
    doPrefetch();
    return;
  }

  if (typeof window !== 'undefined') {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => doPrefetch(), { timeout: 5000 });
    } else {
      // Fallback to setTimeout after a short delay to avoid blocking first paint
      setTimeout(() => doPrefetch(), 3000);
    }
  }
}

export default {
  scheduleMapPrefetchOnIdle,
};
