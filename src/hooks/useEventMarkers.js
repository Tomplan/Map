import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabaseClient';

/**
 * Updated hook to fetch markers with company assignments
 * Uses new Companies and Assignments tables structure
 */
export default function useEventMarkers(eventYear = new Date().getFullYear()) {
  const cached = typeof window !== 'undefined' ? localStorage.getItem('eventMarkers') : null;
  const initialOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  const [isOnline, setIsOnline] = useState(initialOnline);
  const [markers, setMarkers] = useState(() => {
    if (!initialOnline && cached) {
      return JSON.parse(cached);
    }
    return [];
  });
  const [loading, setLoading] = useState(() => {
    if (!initialOnline && cached) {
      return false;
    }
    return true;
  });

  // Use ref to store current eventYear so real-time subscriptions always use latest value
  const eventYearRef = useRef(eventYear);

  // Update ref whenever eventYear changes
  useEffect(() => {
    eventYearRef.current = eventYear;
  }, [eventYear]);

  const loadMarkers = useCallback(
    async (online) => {
      // Always use the latest eventYear from ref
      const targetYear = eventYearRef.current;

      setLoading(true);
      if (!online && cached) {
        setMarkers(JSON.parse(cached));
        setLoading(false);
        return;
      }

      try {
        // Fetch all data in parallel, including defaults for booth markers
        // Note: Markers_Admin is deprecated - booth admin data comes from event_subscriptions
        const [coreRes, appearanceRes, contentRes, assignmentsRes, subscriptionsRes] = await Promise.all([
          supabase.from('markers_core').select('*').or(`event_year.eq.${targetYear},event_year.eq.0`),
          supabase.from('markers_appearance').select('*').or(`event_year.eq.${targetYear},event_year.eq.0`),
          supabase.from('markers_content').select('*').eq('event_year', targetYear),
          supabase.from('assignments').select(`
            *,
            company:companies(id, name, logo, website, info, company_translations(language_code, info))
          `).eq('event_year', targetYear),
          supabase.from('event_subscriptions').select('*').eq('event_year', targetYear),
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

        const contentById = {};
        for (const row of contentRes.data || []) {
          if (row && row.id) contentById[row.id] = row;
        }

        // Extract defaults for booth markers (IDs -1 and -2)
        const assignedDefaults = {
          appearance: appearanceById[-1] || {},
          core: (coreRes.data || []).find(row => row.id === -1) || {},
        };

        const unassignedDefaults = {
          appearance: appearanceById[-2] || {},
          core: (coreRes.data || []).find(row => row.id === -2) || {},
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
          .filter(marker => marker.id > 0) // Exclude defaults (-1, -2)
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
            const hasAssignment = !!primaryAssignment.companyId;

            contentData = {
              name: primaryAssignment.name,
              logo: primaryAssignment.logo,
              website: primaryAssignment.website,
              info: primaryAssignment.info,
              companyId: primaryAssignment.companyId,
              assignmentId: primaryAssignment.assignmentId,
              company_translations: primaryAssignment.company_translations,
            };

            // Apply global defaults based on assignment status
            // Defaults are applied first, then individual marker values override them
            const defaults = hasAssignment ? assignedDefaults : unassignedDefaults;

            // Merge appearance defaults (individual marker values take precedence)
            const mergedAppearance = {
              ...defaults.appearance,
              ...appearance, // Individual marker values override defaults
            };

            // Merge core defaults (for rectangles, etc.)
            const mergedCore = {
              ...defaults.core,
              ...marker, // Individual marker values override defaults
            };

            // Update marker with merged defaults
            Object.assign(marker, mergedCore);
            Object.assign(appearance, mergedAppearance);

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
        localStorage.setItem('eventMarkers', JSON.stringify(mergedMarkers));
      } catch (error) {
        console.error('Error loading markers:', error);
      } finally {
        setLoading(false);
      }
    },
    [cached]
  );

  useEffect(() => {
    loadMarkers(isOnline);

    function handleOnline() {
      setIsOnline(true);
      loadMarkers(true);
    }

    function handleOffline() {
      setIsOnline(false);
      const cached = localStorage.getItem('eventMarkers');
      if (cached) {
        setMarkers(JSON.parse(cached));
      }
      setLoading(false);
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Supabase realtime subscriptions for all related tables
    const coreChannel = supabase
      .channel(`markers-core-changes-${eventYear}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'markers_core',
        filter: `event_year=eq.${eventYear}`
      }, () => {
        loadMarkers(true);
      })
      .subscribe();

    const appearanceChannel = supabase
      .channel(`markers-appearance-changes-${eventYear}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'markers_appearance',
        filter: `event_year=eq.${eventYear}`
      }, () => {
        loadMarkers(true);
      })
      .subscribe();

    const contentChannel = supabase
      .channel(`markers-content-changes-${eventYear}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'markers_content',
        filter: `event_year=eq.${eventYear}`
      }, () => {
        loadMarkers(true);
      })
      .subscribe();

    // Note: Markers_Admin subscription removed - admin data comes from event_subscriptions

    const assignmentsChannel = supabase
      .channel('markers-assignments-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assignments' }, async (payload) => {
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
      })
      .subscribe();

    const companiesChannel = supabase
      .channel('companies-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'companies' }, (payload) => {
        // Company data changed - update all markers using this company
        if (payload.eventType === 'UPDATE' && payload.new) {
          const company = payload.new;
          setMarkers(prev => prev.map(m =>
            m.companyId === company.id
              ? { ...m, name: company.name, logo: company.logo, website: company.website, info: company.info }
              : m
          ));
          // Update localStorage
          setMarkers(current => {
            localStorage.setItem('eventMarkers', JSON.stringify(current));
            return current;
          });
        } else {
          // For INSERT/DELETE, do full reload (rare events)
          loadMarkers(true);
        }
      })
      .subscribe();

    const subscriptionsChannel = supabase
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
        }
      )
      .subscribe();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      supabase.removeChannel(coreChannel);
      supabase.removeChannel(appearanceChannel);
      supabase.removeChannel(contentChannel);
      supabase.removeChannel(assignmentsChannel);
      supabase.removeChannel(companiesChannel);
      supabase.removeChannel(subscriptionsChannel);
    };
  }, [isOnline, loadMarkers]);

  // Reload markers when eventYear changes
  useEffect(() => {
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

  // Copy markers from previous year
  const copyFromPreviousYear = useCallback(async (sourceYear) => {
    try {
      // Fetch markers from source year
      const [coreRes, appearanceRes, contentRes] = await Promise.all([
        supabase.from('markers_core').select('*').eq('event_year', sourceYear),
        supabase.from('markers_appearance').select('*').eq('event_year', sourceYear),
        supabase.from('markers_content').select('*').eq('event_year', sourceYear),
      ]);

      if (coreRes.error) throw coreRes.error;
      if (appearanceRes.error) throw appearanceRes.error;
      if (contentRes.error) throw contentRes.error;

      // Copy core markers to current year
      if (coreRes.data && coreRes.data.length > 0) {
        const newCoreMarkers = coreRes.data.map(marker => {
          const { id, ...markerData } = marker; // Exclude id to let database generate it
          return {
            ...markerData,
            event_year: eventYear,
          };
        });
        const { error: coreInsertError } = await supabase
          .from('markers_core')
          .insert(newCoreMarkers);
        if (coreInsertError) throw coreInsertError;
      }

      // Copy appearance markers to current year
      if (appearanceRes.data && appearanceRes.data.length > 0) {
        const newAppearanceMarkers = appearanceRes.data.map(marker => {
          const { id, ...markerData } = marker; // Exclude id to let database generate it
          return {
            ...markerData,
            event_year: eventYear,
          };
        });
        const { error: appearanceInsertError } = await supabase
          .from('markers_appearance')
          .insert(newAppearanceMarkers);
        if (appearanceInsertError) throw appearanceInsertError;
      }

      // Copy content markers to current year
      if (contentRes.data && contentRes.data.length > 0) {
        const newContentMarkers = contentRes.data.map(marker => {
          const { id, ...markerData } = marker; // Exclude id to let database generate it
          return {
            ...markerData,
            event_year: eventYear,
          };
        });
        const { error: contentInsertError } = await supabase
          .from('markers_content')
          .insert(newContentMarkers);
        if (contentInsertError) throw contentInsertError;
      }

      // Reload markers to show the copied data
      await loadMarkers(isOnline);
      return { data: { copied: (coreRes.data?.length || 0) }, error: null };
    } catch (err) {
      console.error('Error copying markers from previous year:', err);
      return { data: null, error: err.message };
    }
  }, [eventYear, isOnline, loadMarkers]);

  return {
    markers,
    loading,
    isOnline,
    reload: () => loadMarkers(isOnline),
    archiveCurrentYear,
    copyFromPreviousYear
  };
}
