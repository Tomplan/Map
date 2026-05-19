import { getMarkerSnapshot } from './idbCache';
import { getLogoPath } from '../utils/getLogoPath';
import { supabase } from '../supabaseClient';
import { groupActivitiesByDay, writeCachedEventActivities } from './eventActivitiesCache';

const APP_ASSETS_CACHE = 'static-assets-v5';

function getLikelyEventYear() {
  if (typeof window !== 'undefined' && window.localStorage) {
    const storedYear = window.localStorage.getItem('selectedEventYear');
    const parsedYear = storedYear ? parseInt(storedYear, 10) : NaN;
    if (!Number.isNaN(parsedYear)) {
      return parsedYear;
    }
  }

  return new Date().getFullYear();
}

async function cacheLoadedAssetResources() {
  if (typeof window === 'undefined' || !window.caches || !window.performance) {
    return;
  }

  try {
    const assetUrls = performance
      .getEntriesByType('resource')
      .map((entry) => entry.name)
      .filter((url) => {
        try {
          const parsed = new URL(url, window.location.origin);
          return (
            parsed.origin === window.location.origin &&
            parsed.pathname.includes('/assets/') &&
            /\.(js|css)$/i.test(parsed.pathname)
          );
        } catch (err) {
          return false;
        }
      });

    if (assetUrls.length === 0) return;

    const cache = await window.caches.open(APP_ASSETS_CACHE);

    await Promise.allSettled(
      Array.from(new Set(assetUrls)).map(async (url) => {
        const existing = await cache.match(url);
        if (existing) return;

        const response = await fetch(url, { credentials: 'same-origin' });
        if (response && response.ok) {
          await cache.put(url, response.clone());
        }
      }),
    );
  } catch (err) {
    // Best-effort cache warming only.
  }
}

async function prefetchScheduleData(year) {
  try {
    const { data, error } = await supabase
      .from('event_activities')
      .select(
        `
          id, organization_id, day, start_time, end_time, display_order,
          title_nl, title_en, title_de,
          description_nl, description_en, description_de,
          location_type, company_id,
          location_nl, location_en, location_de,
          badge_nl, badge_en, badge_de,
          is_active, show_location_type_badge,
          created_at, updated_at, created_by, updated_by,
          companies!event_activities_company_id_fkey (
            id,
            name
          )
        `,
      )
      .eq('event_year', year)
      .order('display_order', { ascending: true });

    if (error) throw error;

    writeCachedEventActivities(year, groupActivitiesByDay(data || []));
  } catch (err) {
    // Ignore prefetch failures.
  }
}

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
      let logoUrls = [];
      if (snapshot) {
        postMessageToSW({ type: 'STORE_SNAPSHOT', snapshot });

        // Retrieve offline logo URLs to prefetch them explicitly
        const seenLogos = new Set();
        Object.values(snapshot).forEach((markerList) => {
          if (Array.isArray(markerList)) {
            markerList.forEach((marker) => {
              if (marker && marker.logo && !seenLogos.has(marker.logo)) {
                seenLogos.add(marker.logo);
                // Pre-apply logo formatting so we cache exactly what the DOM will request
                try {
                  const formatted = getLogoPath(marker.logo);
                  if (formatted) logoUrls.push(formatted);
                } catch {
                  logoUrls.push(marker.logo);
                }
              }
            });
          }
        });
      }

      // Dynamically import the EventMap inner chunk to let the browser fetch and cache it
      // We intentionally don't attach it to the DOM; this warms the network cache and
      // ensures the chunk is available offline if the service worker caches it or if
      // it's present in HTTP cache.
      // await import('../components/EventMap/EventMapInner');

      // Optionally, tell the service worker to cache specific known asset URLs (CSS/images)
      postMessageToSW({
        type: 'CACHE_URLS',
        urls: [
          '/assets/icons/glyph-marker-icon-blue.svg',
          '/assets/icons/marker-shadow.png',
          '/assets/logos/4x4Vakantiebeurs_FClogo_2026.png',
          ...logoUrls, // Pass the dynamically aggregated logo URLs to to the SW
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

export function scheduleVisitorRoutePrefetchOnIdle(opts = {}) {
  const { immediate = false } = opts;

  const doPrefetch = async () => {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      return;
    }

    try {
      const eventYear = getLikelyEventYear();

      // Trigger map/snapshot prefetch as well (this handles offline markers and logos)
      scheduleMapPrefetchOnIdle({ immediate: true });

      await import('../components/EventSchedule.jsx');
      await cacheLoadedAssetResources();
      await prefetchScheduleData(eventYear);

      await Promise.allSettled([
        import('../components/HomePage.jsx'),
        import('../components/EventMap/EventMap.jsx'),
        import('../components/ExhibitorListView.jsx'),
      ]);

      await cacheLoadedAssetResources();
    } catch (err) {
      // Best-effort prefetch only.
    }
  };

  if (immediate || (typeof process !== 'undefined' && process.env && process.env.JEST_WORKER_ID)) {
    doPrefetch();
    return;
  }

  if (typeof window !== 'undefined') {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => doPrefetch(), { timeout: 5000 });
    } else {
      setTimeout(() => doPrefetch(), 3000);
    }
  }
}

export default {
  scheduleMapPrefetchOnIdle,
  scheduleVisitorRoutePrefetchOnIdle,
};
