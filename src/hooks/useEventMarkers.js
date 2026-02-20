import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabaseClient';

/**
 * Updated hook to fetch markers with company assignments
 * Uses new Companies and Assignments tables structure
 */
export default function useEventMarkers(eventYear = new Date().getFullYear()) {
  // decide whether we have previously cached markers for offline mode
  const cached = typeof window !== 'undefined' ? localStorage.getItem('eventMarkers') : null;

  // in-memory cache keyed by year
  if (!useEventMarkers.cache) useEventMarkers.cache = new Map();
  let entry = useEventMarkers.cache.get(eventYear);
  if (!entry) {
    entry = {
      state: {
        markers: [],
        loading: true,
        error: null,
        isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      },
      listeners: new Set(),
      refCount: 0,
      channels: {},
      reloadTimeout: null,
      notifyTimeout: null,
      loadPromise: null,
      windowHandlers: null,
    };
    useEventMarkers.cache.set(eventYear, entry);
  }

  // local state mirrors entry.state
  const [local, setLocal] = useState({
    markers: entry.state.markers,
    loading: entry.state.loading,
    error: entry.state.error,
    isOnline: entry.state.isOnline,
  });
  // helper for easier access
  const { isOnline } = local;

  // Use ref to store current eventYear so real-time subscriptions always use latest value
  const eventYearRef = useRef(eventYear);

  // Update ref whenever eventYear changes
  useEffect(() => {
    eventYearRef.current = eventYear;
    if (process.env.NODE_ENV !== 'production') {
      console.debug('[useEventMarkers] eventYearRef updated to', eventYear);
    }
  }, [eventYear]);

  const loadMarkers = useCallback(
    async (online, isBackground = false) => {
      if (entry.loadPromise) return entry.loadPromise;

      // short-circuit offline cached state
      if (!online && cached) {
        entry.state.markers = JSON.parse(cached);
        entry.state.loading = false;
        entry.listeners.forEach((l) => l(entry.state));
        return;
      }

      if (!isBackground) {
        entry.state.loading = true;
        entry.state.error = null;
        entry.listeners.forEach((l) => l(entry.state));
      }

      entry.loadPromise = (async () => {
        try {
          const targetYear = eventYear;
          // query the consolidated view instead of separate tables
          let mergedMarkers;
          try {
            const { data: viewData, error: viewError } = await supabase
              .from('event_markers_view')
              .select('*')
              .eq('event_year', targetYear);
            if (viewError) throw viewError;

            // the view already returns assignments as an array plus subscription fields
            // rename fields to match the old mergedMarkers shape
            mergedMarkers = (viewData || [])
              .filter((marker) => marker.id > 0)
              .map((m) => {
                const assignments = m.assignments || [];
                let contentData = {};
                let adminData = {};
                if (m.id < 1000) {
                  const primary = assignments[0] || {};
                  contentData = {
                    name: primary.name,
                    logo: primary.logo,
                    website: primary.website,
                    info: primary.info,
                    companyId: primary.companyId,
                    assignmentId: primary.assignmentId,
                  };
                  if (primary.companyId) {
                    adminData = {
                      contact: m.sub_contact,
                      phone: m.sub_phone,
                      email: m.sub_email,
                      boothCount: m.sub_booth_count,
                      area: m.sub_area,
                      coins: m.sub_coins,
                      breakfast: m.sub_breakfast,
                      lunch: m.sub_lunch,
                      bbq: m.sub_bbq,
                      notes: null,
                    };
                  }
                } else {
                  contentData = {
                    name: m.content_name,
                    logo: m.content_logo,
                    website: m.content_website,
                    info: m.content_info,
                  };
                }
                // spread appearance fields are already part of m
                return {
                  ...m,
                  ...contentData,
                  ...adminData,
                  assignments,
                };
              });
          } catch (err) {
            // if the view doesn't exist yet (common on older deployments), fall back to legacy queries
            if (err.code === 'PGRST205' || /Could not find the table/.test(err.message)) {
              console.warn('event_markers_view missing, falling back to legacy queries');
              const [
                coreRes,
                appearanceRes,
                contentRes,
                assignmentsRes,
                subscriptionsRes,
                defaultsRes,
              ] = await Promise.all([
                supabase
                  .from('markers_core')
                  .select('*')
                  .or(`event_year.eq.${targetYear},event_year.eq.0`),
                supabase.from('markers_appearance').select('*').eq('event_year', targetYear),
                supabase.from('markers_content').select('*').eq('event_year', targetYear),
                supabase
                  .from('assignments')
                  .select(
                    `
            *,
            company:companies(id, name, logo, website, info)
          `,
                  )
                  .eq('event_year', targetYear),
                supabase.from('event_subscriptions').select('*').eq('event_year', targetYear),
                supabase.from('organization_settings').select('*').limit(1).maybeSingle(), // defaults
              ]);
              if (coreRes.error) throw coreRes.error;
              if (appearanceRes.error) throw appearanceRes.error;
              if (contentRes.error) throw contentRes.error;
              if (assignmentsRes.error) throw assignmentsRes.error;
              if (subscriptionsRes.error) throw subscriptionsRes.error;

              const appearanceById = {};
              for (const row of appearanceRes.data || []) {
                if (row && row.id) appearanceById[row.id] = row;
              }
              for (const row of defaultsRes.data || []) {
                if (row && row.id) appearanceById[row.id] = row;
              }
              const contentById = {};
              for (const row of contentRes.data || []) {
                if (row && row.id) contentById[row.id] = row;
              }
              const subscriptionByCompany = {};
              for (const sub of subscriptionsRes.data || []) {
                if (sub && sub.company_id) {
                  subscriptionByCompany[sub.company_id] = sub;
                }
              }
              const assignmentsByMarker = {};
              for (const assignment of assignmentsRes.data || []) {
                if (!assignment || !assignment.marker_id) continue;
                if (!assignmentsByMarker[assignment.marker_id]) {
                  assignmentsByMarker[assignment.marker_id] = [];
                }
                assignmentsByMarker[assignment.marker_id].push({
                  assignmentId: assignment.id,
                  companyId: assignment.company_id,
                  ...assignment.company,
                });
              }
              mergedMarkers = (coreRes.data || [])
                .filter((marker) => marker.id > 0)
                .map((marker) => {
                  const appearance = appearanceById[marker.id] || {};
                  const content = contentById[marker.id] || {};
                  const assignments = assignmentsByMarker[marker.id] || [];
                  let contentData = {};
                  let adminData = {};
                  if (marker.id < 1000) {
                    const primaryAssignment = assignments[0] || {};
                    contentData = {
                      name: primaryAssignment.name,
                      logo: primaryAssignment.logo,
                      website: primaryAssignment.website,
                      info: primaryAssignment.info,
                      companyId: primaryAssignment.companyId,
                      assignmentId: primaryAssignment.assignmentId,
                    };
                    if (primaryAssignment.companyId) {
                      const subscription = subscriptionByCompany[primaryAssignment.companyId] || {};
                      adminData = {
                        contact: subscription.contact,
                        phone: subscription.phone,
                        email: subscription.email,
                        boothCount: subscription.booth_count,
                        area: subscription.area,
                        coins: subscription.coins,
                        breakfast: subscription.breakfast_sat,
                        lunch: subscription.lunch_sat,
                        bbq: subscription.bbq_sat,
                        notes: subscription.notes,
                      };
                    }
                  } else {
                    contentData = {
                      name: content.name,
                      logo: content.logo,
                      website: content.website,
                      info: content.info,
                    };
                    adminData = {};
                  }
                  return {
                    ...marker,
                    ...appearance,
                    ...contentData,
                    ...adminData,
                    assignments,
                  };
                });
            } else {
              throw err;
            }
          }
          // the view already includes company_translations as a json array
          // nothing else to do here
          entry.state.markers = mergedMarkers;
          if (typeof window !== 'undefined') {
            localStorage.setItem('eventMarkers', JSON.stringify(mergedMarkers));
          }
        } catch (error) {
          // if we already fell back once above we may hit errors again; but log generically
          if (error.code === 'PGRST205' || /Could not find the table/.test(error.message)) {
            console.warn('Marker view not available during loadMarkers:', error.message);
          } else {
            console.error('Error loading markers:', error);
          }
          entry.state.error = error.message;
        } finally {
          if (!isBackground) {
            entry.state.loading = false;
          }
          entry.listeners.forEach((l) => l(entry.state));
          entry.loadPromise = null;
        }
      })();

      // close the useCallback for loadMarkers; dependency on year only
    },
    [eventYear],
  );

  useEffect(() => {
    // update entry pointer (re-create if somehow removed)
    entry = useEventMarkers.cache.get(eventYear);
    if (!entry) {
      entry = {
        state: {
          markers: [],
          loading: true,
          error: null,
          isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
        },
        listeners: new Set(),
        refCount: 0,
        channels: {},
        reloadTimeout: null,
        notifyTimeout: null,
        loadPromise: null,
        windowHandlers: null,
      };
      useEventMarkers.cache.set(eventYear, entry);
    }

    entry.refCount += 1;
    const listener = (s) =>
      setLocal({
        markers: s.markers,
        loading: s.loading,
        error: s.error,
        isOnline: s.isOnline,
      });
    entry.listeners.add(listener);

    // sync current state & kick off load if first
    setLocal({
      markers: entry.state.markers,
      loading: entry.state.loading,
      error: entry.state.error,
      isOnline: entry.state.isOnline,
    });
    if (entry.state.loading && entry.refCount === 1) {
      loadMarkers(entry.state.isOnline);
    } else if (entry.refCount === 1 && entry.state.isOnline) {
      // If we have cached data but just mounted (refCount 1), trigger a background refresh
      // to Ensure we're up to date, but don't set loading=true
      loadMarkers(true, true);
    }

    // window handlers only once per cache entry
    if (!entry.windowHandlers) {
      const handleOnline = () => {
        entry.state.isOnline = true;
        entry.listeners.forEach((l) => l(entry.state));
        loadMarkers(true);
      };
      const handleOffline = () => {
        entry.state.isOnline = false;
        entry.listeners.forEach((l) => l(entry.state));
        const cachedData =
          typeof window !== 'undefined' ? localStorage.getItem('eventMarkers') : null;
        if (cachedData) {
          entry.state.markers = JSON.parse(cachedData);
          entry.state.loading = false;
          entry.listeners.forEach((l) => l(entry.state));
        }
      };
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      entry.windowHandlers = { handleOnline, handleOffline };
    }

    // create realtime channels if missing
    const makeChannel = (name, filter, cb) => {
      if (!entry.channels[name]) {
        entry.channels[name] = supabase
          .channel(name)
          .on('postgres_changes', filter, cb)
          .subscribe();
      }
      return entry.channels[name];
    };

    makeChannel(
      `markers-core-changes-${eventYear}`,
      {
        event: '*',
        schema: 'public',
        table: 'markers_core',
        filter: `event_year=eq.${eventYear}`,
      },
      () => {
        entry.reloadTimeout && clearTimeout(entry.reloadTimeout);
        entry.reloadTimeout = setTimeout(() => loadMarkers(true, true), 500);
      },
    );
    makeChannel(
      `markers-appearance-changes-${eventYear}`,
      {
        event: '*',
        schema: 'public',
        table: 'markers_appearance',
        filter: `event_year=eq.${eventYear}`,
      },
      () => {
        entry.reloadTimeout && clearTimeout(entry.reloadTimeout);
        entry.reloadTimeout = setTimeout(() => loadMarkers(true, true), 500);
      },
    );
    makeChannel(
      'markers-appearance-defaults-changes',
      { event: '*', schema: 'public', table: 'markers_appearance', filter: 'event_year=eq.0' },
      () => {
        entry.reloadTimeout && clearTimeout(entry.reloadTimeout);
        entry.reloadTimeout = setTimeout(() => loadMarkers(true, true), 500);
      },
    );
    makeChannel(
      `markers-content-changes-${eventYear}`,
      {
        event: '*',
        schema: 'public',
        table: 'markers_content',
        filter: `event_year=eq.${eventYear}`,
      },
      () => {
        entry.reloadTimeout && clearTimeout(entry.reloadTimeout);
        entry.reloadTimeout = setTimeout(() => loadMarkers(true, true), 500);
      },
    );
    makeChannel(
      'markers-assignments-changes',
      { event: '*', schema: 'public', table: 'assignments' },
      (payload) => {
        if (payload.eventType === 'DELETE') {
          entry.reloadTimeout && clearTimeout(entry.reloadTimeout);
          entry.reloadTimeout = setTimeout(() => loadMarkers(true, true), 500);
        } else if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          if (payload.new?.event_year === eventYear) {
            entry.reloadTimeout && clearTimeout(entry.reloadTimeout);
            entry.reloadTimeout = setTimeout(() => loadMarkers(true, true), 500);
          }
        }
      },
    );
    makeChannel(
      'companies-changes',
      { event: '*', schema: 'public', table: 'companies' },
      (payload) => {
        if (payload.eventType === 'UPDATE' && payload.new) {
          entry.state.markers = entry.state.markers.map((m) =>
            m.companyId === payload.new.id
              ? {
                  ...m,
                  name: payload.new.name,
                  logo: payload.new.logo,
                  website: payload.new.website,
                  info: payload.new.info,
                }
              : m,
          );

          if (entry.notifyTimeout) clearTimeout(entry.notifyTimeout);
          entry.notifyTimeout = setTimeout(() => {
            if (typeof window !== 'undefined') {
              localStorage.setItem('eventMarkers', JSON.stringify(entry.state.markers));
            }
            entry.listeners.forEach((l) => l(entry.state));
          }, 300);
        } else {
          entry.reloadTimeout && clearTimeout(entry.reloadTimeout);
          entry.reloadTimeout = setTimeout(() => loadMarkers(true, true), 500);
        }
      },
    );
    makeChannel(
      `event-subscriptions-changes-${eventYear}`,
      {
        event: '*',
        schema: 'public',
        table: 'event_subscriptions',
        filter: `event_year=eq.${eventYear}`,
      },
      () => {
        entry.reloadTimeout && clearTimeout(entry.reloadTimeout);
        entry.reloadTimeout = setTimeout(() => loadMarkers(true, true), 500);
      },
    );

    return () => {
      entry.listeners.delete(listener);
      entry.refCount -= 1;
      if (entry.refCount <= 0) {
        // cleanup
        if (entry.windowHandlers) {
          window.removeEventListener('online', entry.windowHandlers.handleOnline);
          window.removeEventListener('offline', entry.windowHandlers.handleOffline);
          entry.windowHandlers = null;
        }
        Object.values(entry.channels).forEach((ch) => supabase.removeChannel(ch));
        entry.channels = {};
        // useEventMarkers.cache.delete(eventYear); // CACHE PERSISTENCE FIX
      }
      if (entry && entry.reloadTimeout) clearTimeout(entry.reloadTimeout);
      if (entry && entry.notifyTimeout) clearTimeout(entry.notifyTimeout);
    };
  }, [eventYear, loadMarkers]);

  // Reload markers when eventYear changes
  // useEffect(() => {
  //   if (process.env.NODE_ENV !== 'production') {
  //     console.debug('[useEventMarkers] eventYear changed -> triggering loadMarkers for', eventYear);
  //   }
  //   loadMarkers(isOnline);
  // }, [eventYear, isOnline, loadMarkers]);

  // Archive current year markers and prepare for next year
  const archiveCurrentYear = useCallback(async () => {
    try {
      // Call Supabase function to archive
      const { data, error: archiveError } = await supabase.rpc('archive_markers', {
        event_year_to_archive: eventYear,
      });

      if (archiveError) throw archiveError;

      // Reload markers to show empty state
      await loadMarkers(isOnline);
      return { data, error: null };
    } catch (err) {
      console.error('Error archiving markers:', err);
      return { data: null, error: err.message };
    }
  }, [eventYear, isOnline, loadMarkers]);

  // Copy markers from previous year (skip existing markers)
  const copyFromPreviousYear = useCallback(
    async (sourceYear) => {
      try {
        // First, check which marker IDs already exist in the target year
        const [existingCoreRes, existingAppearanceRes, existingContentRes] = await Promise.all([
          supabase.from('markers_core').select('id').eq('event_year', eventYear),
          supabase.from('markers_appearance').select('id').eq('event_year', eventYear),
          supabase.from('markers_content').select('id').eq('event_year', eventYear),
        ]);

        if (existingCoreRes.error) throw existingCoreRes.error;
        if (existingAppearanceRes.error) throw existingAppearanceRes.error;
        if (existingContentRes.error) throw existingContentRes.error;

        // Create sets of existing IDs for fast lookup
        const existingCoreIds = new Set((existingCoreRes.data || []).map((m) => m.id));
        const existingAppearanceIds = new Set((existingAppearanceRes.data || []).map((m) => m.id));
        const existingContentIds = new Set((existingContentRes.data || []).map((m) => m.id));

        // Fetch markers from source year
        const [coreRes, appearanceRes, contentRes] = await Promise.all([
          supabase.from('markers_core').select('*').eq('event_year', sourceYear),
          supabase.from('markers_appearance').select('*').eq('event_year', sourceYear),
          supabase.from('markers_content').select('*').eq('event_year', sourceYear),
        ]);

        if (coreRes.error) throw coreRes.error;
        if (appearanceRes.error) throw appearanceRes.error;
        if (contentRes.error) throw contentRes.error;

        let copiedCount = 0;

        // Copy core markers to current year (skip existing)
        if (coreRes.data && coreRes.data.length > 0) {
          const markersToCopy = coreRes.data.filter((marker) => !existingCoreIds.has(marker.id));
          if (markersToCopy.length > 0) {
            const newCoreMarkers = markersToCopy.map((marker) => ({
              ...marker,
              event_year: eventYear,
            }));
            const { error: coreInsertError } = await supabase
              .from('markers_core')
              .insert(newCoreMarkers);
            if (coreInsertError) throw coreInsertError;
            copiedCount += markersToCopy.length;
          }
        }

        // Copy appearance markers to current year (skip existing)
        if (appearanceRes.data && appearanceRes.data.length > 0) {
          const markersToCopy = appearanceRes.data.filter(
            (marker) => !existingAppearanceIds.has(marker.id),
          );
          if (markersToCopy.length > 0) {
            const newAppearanceMarkers = markersToCopy.map((marker) => ({
              ...marker,
              event_year: eventYear,
            }));
            const { error: appearanceInsertError } = await supabase
              .from('markers_appearance')
              .insert(newAppearanceMarkers);
            if (appearanceInsertError) throw appearanceInsertError;
          }
        }

        // Copy content markers to current year (skip existing)
        if (contentRes.data && contentRes.data.length > 0) {
          const markersToCopy = contentRes.data.filter(
            (marker) => !existingContentIds.has(marker.id),
          );
          if (markersToCopy.length > 0) {
            const newContentMarkers = markersToCopy.map((marker) => ({
              ...marker,
              event_year: eventYear,
            }));
            const { error: contentInsertError } = await supabase
              .from('markers_content')
              .insert(newContentMarkers);
            if (contentInsertError) throw contentInsertError;
          }
        }

        // Reload markers to show the copied data
        await loadMarkers(isOnline);
        return { data: { copied: copiedCount }, error: null };
      } catch (err) {
        console.error('Error copying markers from previous year:', err);
        return { data: null, error: err.message };
      }
    },
    [eventYear, isOnline, loadMarkers],
  );

  return {
    markers: local.markers,
    loading: local.loading,
    isOnline: local.isOnline,
    reload: () => loadMarkers(local.isOnline),
    archiveCurrentYear,
    copyFromPreviousYear,
  };
}
