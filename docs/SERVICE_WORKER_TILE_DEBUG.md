# Service Worker Tile Debugging & Safe Defaults

This repo ships a simple Service Worker used for caching some static assets and map tiles for offline convenience. During development or when debugging missing map tiles you may encounter grey/blank areas where tiles failed to load.

Why this happens

- The service worker can intercept network requests for cross-origin tile providers (eg. Carto, ESRI). If the worker's fetch handler fails (network error) and rejects, the request may fail and tiles won't render.
- Cross-origin tiles often return opaque responses and can be tricky to snapshot with tools like html2canvas.

Quick debug checklist

1. Hard-refresh your page (Shift+Cmd+R) to bypass cache.
2. Open DevTools → Application → Service Workers and either:
   - check **Bypass for network** and reload, or
   - click **Unregister** then clear site data and reload.
3. Inspect the Network tab: look for tile requests (cartodb-basemaps / arcgisonline / other) and check their initiator and response status.
4. Test fetching the tile manually:

```bash
curl -I "https://cartodb-basemaps-b.global.ssl.fastly.net/rastertiles/voyager_nolabels/18/135277/86712.png"
curl -I "http://localhost:5173/Map/assets/icons/default.svg"
```

Repository defaults and recommended behavior

- In development, we don't intercept cross-origin tile requests in the SW to avoid introducing blank maps when the SW fails or the CDN is temporarily unreachable.
- The SW still caches app-owned assets (icons & logos) to keep offline UX snappy.

Important: if you've visited the app before, your browser may have an old service worker registered which cached an older asset list. After updating the service worker (this repo now pre-caches `assets/icons/default.svg` and avoids caching unsuccessful responses), make sure to unregister the old worker in DevTools or check **Bypass for network** so the new script is installed and takes effect.

If you need robust, offline tile caching

- Consider a server-side tile proxy that re-serves tiles from the same origin with correct CORS headers.
- Or restrict service worker caching to same-origin assets only.

## Map resizing quirks and DevTools

- In some browsers opening or closing DevTools changes the viewport/layout in ways Leaflet doesn't always detect automatically. That can leave tile rows/columns unloaded (grey areas) until the map knows it should re-request tiles.
- To avoid this class of bug we've added ResizeObserver + window resize handling to the map component so Leaflet's `invalidateSize()` is called when the container or window size changes. If you still see missing tiles after resizing, try toggling DevTools or reloading the page with the worker bypassed (see "Quick debug checklist" above).

If you want me to change the service worker behavior further (eg. add network fallbacks, cache-on-success only, or a proxy), tell me which behavior you'd prefer and I'll implement it.
