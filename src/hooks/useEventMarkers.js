import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { getMarkerSnapshot, setMarkerSnapshot } from '../services/idbCache';

/**
 * Updated hook to fetch markers with company assignments
 * Uses new Companies and Assignments tables structure
 */
export default function useEventMarkers(eventYear = new Date().getFullYear()) {
  const initialOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  const [isOnline, setIsOnline] = useState(initialOnline);
  const [markers, setMarkers] = useState([]);
  const [loading, setLoading] = useState(true);

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
    async (online) => {
      // Always use the latest eventYear from ref
      const targetYear = eventYearRef.current;

      if (process.env.NODE_ENV !== 'production') {
        console.debug(`[useEventMarkers] loadMarkers called for year ${targetYear} (online=${online})`);
      }

      setLoading(true);
      if (!online) {
        // Try to load cached snapshot from IndexedDB when offline
        try {
          const snapshot = await getMarkerSnapshot();
          if (snapshot) {
            setMarkers(snapshot);
            setLoading(false);
            return;
          }
        } catch (err) {
          // ignore and proceed to attempt network fetch (which will fail if offline)
        }
      }

      try {
        // Fetch all data in parallel, including defaults for booth markers
        // Note: Markers_Admin is deprecated - booth admin data comes from event_subscriptions
        const [coreRes, appearanceRes, contentRes, assignmentsRes, subscriptionsRes, defaultsRes] =
          await Promise.all([
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
            company:companies(id, name, logo, website, info, company_translations(language_code, info))
          `,
              )
              .eq('event_year', targetYear),
            supabase.from('event_subscriptions').select('*').eq('event_year', targetYear),
            supabase.from('markers_appearance').select('*').or('id.eq.-1,id.eq.-2'), // Fetch defaults separately
          ]);

        if (coreRes.error) throw coreRes.error;
        if (appearanceRes.error) throw appearanceRes.error;
        if (contentRes.error) throw contentRes.error;
        if (assignmentsRes.error) throw assignmentsRes.error;
        if (subscriptionsRes.error) throw subscriptionsRes.error;

        // Build lookup maps
        const appearanceById = {};
        for (const row of appearanceRes.data || []) {
          if (row && row.id) appearanceById[row.id] = row;
        }

        // Ensure defaults are loaded (override any existing)
        for (const row of defaultsRes.data || []) {
          if (row && row.id) appearanceById[row.id] = row;
        }

        const contentById = {};
        for (const row of contentRes.data || []) {
          if (row && row.id) contentById[row.id] = row;
        }

        // Extract defaults for booth markers (IDs -1 and -2)
        const assignedDefaults = {
          appearance: appearanceById[-1] || {},
          core: (coreRes.data || []).find((row) => row.id === -1) || {},
        };

        const unassignedDefaults = {
          appearance: appearanceById[-2] || {},
          core: (coreRes.data || []).find((row) => row.id === -2) || {},
        };

        // Build subscriptions lookup by company_id
        const subscriptionByCompany = {};
        for (const sub of subscriptionsRes.data || []) {
          if (sub && sub.company_id) {
            subscriptionByCompany[sub.company_id] = sub;
          }
        }

        // Group assignments by marker_id
        const assignmentsByMarker = {};
        for (const assignment of assignmentsRes.data || []) {
          if (!assignment || !assignment.marker_id) continue;

          if (!assignmentsByMarker[assignment.marker_id]) {
            assignmentsByMarker[assignment.marker_id] = [];
          }

          assignmentsByMarker[assignment.marker_id].push({
            assignmentId: assignment.id,
            companyId: assignment.company_id,
            ...assignment.company, // Spread company data (name, logo, website, info)
          });
        }

        // Merge all data (exclude default markers from regular list)
        const mergedMarkers = (coreRes.data || [])
          .filter((marker) => marker.id > 0) // Exclude defaults (-1, -2)
          .map((marker) => {
            const appearance = appearanceById[marker.id] || {};
            const content = contentById[marker.id] || {};
            const assignments = assignmentsByMarker[marker.id] || [];

            // Determine content source based on marker type
            let contentData = {};
            let adminData = {};

            if (marker.id < 1000) {
              // Booth markers: use company assignment data
              const primaryAssignment = assignments[0] || {};

              contentData = {
                name: primaryAssignment.name,
                logo: primaryAssignment.logo,
                website: primaryAssignment.website,
                info: primaryAssignment.info,
                companyId: primaryAssignment.companyId,
                assignmentId: primaryAssignment.assignmentId,
                company_translations: primaryAssignment.company_translations,
              };

              // If this marker has a company assignment, get subscription data for admin fields
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
              // Special markers (ID >= 1000): use Markers_Content data
              contentData = {
                name: content.name,
                logo: content.logo,
                website: content.website,
                info: content.info,
              };
              // Special markers don't have admin data (no booth logistics)
              adminData = {};
            }

            return {
              ...marker,
              ...appearance,
              ...contentData,
              ...adminData,

              // Assignment data (for booth markers)
              assignments, // Array of all assignments
            };
          });

        setMarkers(mergedMarkers);
        // Persist a snapshot asynchronously for offline use
        try {
          await setMarkerSnapshot(mergedMarkers);
        } catch (err) {
          // ignore persistence failures
        }
      } catch (error) {
        console.error('Error loading markers:', error);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug('[useEventMarkers] Setting up subscriptions for eventYear', eventYear);
    }

    loadMarkers(isOnline);

    function handleOnline() {
      setIsOnline(true);
      loadMarkers(true);
    }

    async function handleOffline() {
      setIsOnline(false);
      try {
        const snapshot = await getMarkerSnapshot();
        if (snapshot) setMarkers(snapshot);
      } catch (err) {
        // ignore
      }
      setLoading(false);
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Supabase realtime subscriptions for all related tables. Only create channels when online
    const createdChannels = [];
    if (isOnline) {
      const coreChannel = supabase
        .channel(`markers-core-changes-${eventYearRef.current}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'markers_core',
            filter: `event_year=eq.${eventYearRef.current}`,
          },
          () => {
            if (process.env.NODE_ENV !== 'production') {
              console.debug('[useEventMarkers] markers_core change detected — reloading for', eventYearRef.current);
            }
            loadMarkers(true);
          },
        )
        .subscribe();
      createdChannels.push(coreChannel);

      const appearanceChannel = supabase
        .channel(`markers-appearance-changes-${eventYearRef.current}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'markers_appearance',
            filter: `event_year=eq.${eventYearRef.current}`,
          },
          () => {
            loadMarkers(true);
          },
        )
        .subscribe();
      createdChannels.push(appearanceChannel);

      // Separate subscription for default markers (event_year = 0) that affect all years
      const defaultsChannel = supabase
        .channel('markers-appearance-defaults-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'markers_appearance',
            filter: 'event_year=eq.0',
          },
          () => {
            loadMarkers(true);
          },
        )
        .subscribe();
      createdChannels.push(defaultsChannel);

      const contentChannel = supabase
        .channel(`markers-content-changes-${eventYearRef.current}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'markers_content',
            filter: `event_year=eq.${eventYearRef.current}`,
          },
          () => {
            loadMarkers(true);
          },
        )
        .subscribe();
      createdChannels.push(contentChannel);

      // Assignments channel (handle insert/update/delete carefully)
      const assignmentsChannel = supabase
        .channel('markers-assignments-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'assignments' },
          async (payload) => {
            // Handle different event types
            if (payload.eventType === 'DELETE') {
              // Assignment deleted - reload all markers to reflect the deletion
              loadMarkers(true);
            } else if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              // For INSERT/UPDATE, check year before processing
              const assignment = payload.new;
              if (assignment?.event_year !== eventYearRef.current) {
                return;
              }

              // Assignment added/updated - reload all markers to apply correct defaults
              loadMarkers(true);
            }
          },
        )
        .subscribe();
      createdChannels.push(assignmentsChannel);

      // Companies channel
      const companiesChannel = supabase
        .channel('companies-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'companies' }, (payload) => {
          // Company data changed - update all markers using this company
          if (payload.eventType === 'UPDATE' && payload.new) {
            const company = payload.new;
            setMarkers((prev) => {
              const next = prev.map((m) =>
                m.companyId === company.id
                  ? {
                      ...m,
                      name: company.name,
                      logo: company.logo,
                      website: company.website,
                      info: company.info,
                    }
                  : m,
              );
              return next;
            });
            // Persist updated markers asynchronously for the new state
              (async () => {
                try {
                  await setMarkerSnapshot(next);
                } catch (err) {
                  // ignore
                }
              })();
          } else {
            // For INSERT/DELETE, do full reload (rare events)
            loadMarkers(true);
          }
        })
        .subscribe();
      createdChannels.push(companiesChannel);

      // Subscriptions channel
      const subscriptionsChannel = supabase
        .channel(`event-subscriptions-changes-${eventYearRef.current}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'event_subscriptions',
            filter: `event_year=eq.${eventYearRef.current}`,
          },
          (payload) => {
            loadMarkers(true);
          },
        )
        .subscribe();
      createdChannels.push(subscriptionsChannel);
    }


    // Note: Markers_Admin subscription removed - admin data comes from event_subscriptions

    let assignmentsChannel = null;
    if (isOnline) {
      assignmentsChannel = supabase
        .channel('markers-assignments-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'assignments' },
        async (payload) => {
          // Handle different event types
          if (payload.eventType === 'DELETE') {
            // Assignment deleted - reload all markers to reflect the deletion
            // Note: Supabase DELETE payloads don't include marker_id, only the primary key
            loadMarkers(true);
          } else if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            // For INSERT/UPDATE, check year before processing
            const assignment = payload.new;
            if (assignment?.event_year !== eventYearRef.current) {
              return;
            }

            // Assignment added/updated - reload all markers to apply correct defaults
            // (Defaults depend on assignment status, so we need to re-evaluate)
            loadMarkers(true);
          }
        },
      )
      .subscribe();
    }

    let companiesChannel = null;
    if (isOnline) {
      companiesChannel = supabase
        .channel('companies-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'companies' }, (payload) => {
        // Company data changed - update all markers using this company
        if (payload.eventType === 'UPDATE' && payload.new) {
          const company = payload.new;
          setMarkers((prev) =>
            prev.map((m) =>
              m.companyId === company.id
                ? {
                    ...m,
                    name: company.name,
                    logo: company.logo,
                    website: company.website,
                    info: company.info,
                  }
                : m,
            ),
          );
          // Persist updated markers asynchronously
          setMarkers(async (current) => {
            try {
              await setMarkerSnapshot(current);
            } catch (err) {
              // ignore
            }
            return current;
          });
        } else {
          // For INSERT/DELETE, do full reload (rare events)
          loadMarkers(true);
        }
      })
      .subscribe();

    }

    let subscriptionsChannel = null;
    if (isOnline) {
      subscriptionsChannel = supabase
        .channel(`event-subscriptions-changes-${eventYear}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'event_subscriptions',
          filter: `event_year=eq.${eventYear}`,
        },
        (payload) => {
          loadMarkers(true);
        },
      )
      .subscribe();

    }

    return () => {
      if (process.env.NODE_ENV !== 'production') {
        console.debug('[useEventMarkers] Removing subscriptions for eventYear', eventYear);
      }
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      // Remove any channels we created while online
      if (createdChannels.length) {
        createdChannels.forEach((ch) => supabase.removeChannel(ch));
      }
      // Also remove channels created conditionally
      if (assignmentsChannel) supabase.removeChannel(assignmentsChannel);
      if (companiesChannel) supabase.removeChannel(companiesChannel);
      if (subscriptionsChannel) supabase.removeChannel(subscriptionsChannel);
    };
  }, [isOnline, loadMarkers, eventYear]);

  // Reload markers when eventYear changes
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug('[useEventMarkers] eventYear changed -> triggering loadMarkers for', eventYear);
    }
    loadMarkers(isOnline);
  }, [eventYear, isOnline, loadMarkers]);

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
    markers,
    loading,
    isOnline,
    reload: () => loadMarkers(isOnline),
    archiveCurrentYear,
    copyFromPreviousYear,
  };
}
