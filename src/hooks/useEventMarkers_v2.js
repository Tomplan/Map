import { useState, useEffect, useCallback } from 'react';
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

  const loadMarkers = useCallback(
    async (online) => {
      setLoading(true);
      if (!online && cached) {
        setMarkers(JSON.parse(cached));
        setLoading(false);
        return;
      }

      try {
        // Fetch all data in parallel
        const [coreRes, appearanceRes, assignmentsRes] = await Promise.all([
          supabase.from('Markers_Core').select('*'),
          supabase.from('Markers_Appearance').select('*'),
          supabase.from('assignments').select(`
            *,
            company:companies(id, name, logo, website, info)
          `).eq('event_year', eventYear),
        ]);

        if (coreRes.error) throw coreRes.error;
        if (appearanceRes.error) throw appearanceRes.error;
        if (assignmentsRes.error) throw assignmentsRes.error;

        // Build lookup maps
        const appearanceById = {};
        for (const row of appearanceRes.data || []) {
          if (row && row.id) appearanceById[row.id] = row;
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
            boothNumber: assignment.booth_number,
            ...assignment.company, // Spread company data (name, logo, website, info)
          });
        }

        // Merge all data
        const mergedMarkers = (coreRes.data || []).map((marker) => {
          const appearance = appearanceById[marker.id] || {};
          const assignments = assignmentsByMarker[marker.id] || [];

          // For backward compatibility, if there's only one assignment,
          // spread its data at the marker level
          const primaryAssignment = assignments[0] || {};

          return {
            ...marker,
            ...appearance,

            // Assignment data
            assignments, // Array of all assignments

            // Primary assignment (for backward compatibility)
            boothNumber: primaryAssignment.boothNumber,
            name: primaryAssignment.name,
            logo: primaryAssignment.logo,
            website: primaryAssignment.website,
            info: primaryAssignment.info,
            companyId: primaryAssignment.companyId,
            assignmentId: primaryAssignment.assignmentId,
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
    [cached, eventYear]
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
      .channel('markers-core-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Markers_Core' }, () => {
        loadMarkers(true);
      })
      .subscribe();

    const appearanceChannel = supabase
      .channel('markers-appearance-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Markers_Appearance' }, () => {
        loadMarkers(true);
      })
      .subscribe();

    const assignmentsChannel = supabase
      .channel('assignments-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Assignments' }, () => {
        loadMarkers(true);
      })
      .subscribe();

    const companiesChannel = supabase
      .channel('companies-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Companies' }, () => {
        loadMarkers(true);
      })
      .subscribe();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      supabase.removeChannel(coreChannel);
      supabase.removeChannel(appearanceChannel);
      supabase.removeChannel(assignmentsChannel);
      supabase.removeChannel(companiesChannel);
    };
  }, [isOnline, loadMarkers]);

  return { markers, loading, isOnline, reload: () => loadMarkers(isOnline) };
}
