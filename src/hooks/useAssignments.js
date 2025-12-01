import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabaseClient';

/**
 * Hook to manage Assignments (Company-to-Marker mappings per year)
 */
export default function useAssignments(eventYear = new Date().getFullYear()) {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Use ref to store current eventYear so real-time subscriptions always use latest value
  const eventYearRef = useRef(eventYear);

  // Update ref whenever eventYear changes
  useEffect(() => {
    eventYearRef.current = eventYear;
  }, [eventYear]);

  // Load assignments for specific year
  const loadAssignments = useCallback(
    async (year) => {
      try {
        setLoading(true);
        setError(null);

        // Always use the latest eventYear from ref if no year specified
        const targetYear = year !== undefined ? year : eventYearRef.current;

        // First get valid marker IDs for this year
        const { data: validMarkers, error: markersError } = await supabase
          .from('markers_core')
          .select('id')
          .eq('event_year', targetYear);

        if (markersError) throw markersError;

        const validMarkerIds = validMarkers?.map(m => m.id) || [];

        // Only load assignments for markers that exist in this year's markers
        const { data, error: fetchError } = await supabase
          .from('assignments')
          .select(
            `
          *,
          company:companies(id, name, logo, website, info, company_translations(language_code, info)),
          marker:markers_core(id, lat, lng)
        `
          )
          .eq('event_year', targetYear)
          .in('marker_id', validMarkerIds)
          .order('marker_id', { ascending: true });

        if (fetchError) throw fetchError;

        setAssignments(data || []);

        if (fetchError) throw fetchError;

        setAssignments(data || []);
      } catch (err) {
        console.error('Error loading assignments:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [] // eventYear removed from dependencies
  );

  // Create new assignment
  const createAssignment = useCallback(
    async (assignmentData) => {
      try {
        const dataWithYear = {
          ...assignmentData,
          event_year: assignmentData.event_year || eventYear,
        };

        const { data, error: insertError } = await supabase
          .from('assignments')
          .insert([dataWithYear])
          .select(
            `
          *,
          company:companies(id, name, logo, website, info, company_translations(language_code, info)),
          marker:markers_core(id, lat, lng)
        `
          )
          .single();

        if (insertError) throw insertError;

        setAssignments((prev) => [...prev, data].sort((a, b) => a.marker_id - b.marker_id));
        return { data, error: null };
      } catch (err) {
        console.error('Error creating assignment:', err);
        return { data: null, error: err.message };
      }
    },
    [eventYear]
  );

  // Update assignment (change booth number or company)
  const updateAssignment = useCallback(async (id, updates) => {
    try {
      const { data, error: updateError } = await supabase
        .from('assignments')
        .update(updates)
        .eq('id', id)
        .select(
          `
          *,
          company:companies(id, name, logo, website, info, company_translations(language_code, info)),
          marker:markers_core(id, lat, lng)
        `
        )
        .single();

      if (updateError) throw updateError;

      setAssignments((prev) =>
        prev.map((a) => (a.id === id ? data : a)).sort((a, b) => a.marker_id - b.marker_id)
      );
      return { data, error: null };
    } catch (err) {
      console.error('Error updating assignment:', err);
      return { data: null, error: err.message };
    }
  }, []);

  // Delete assignment
  const deleteAssignment = useCallback(async (id) => {
    try {
      const { error: deleteError } = await supabase.from('assignments').delete().eq('id', id);

      if (deleteError) throw deleteError;

      setAssignments((prev) => prev.filter((a) => a.id !== id));
      return { error: null };
    } catch (err) {
      console.error('Error deleting assignment:', err);
      return { error: err.message };
    }
  }, []);

  // Assign company to marker
  const assignCompanyToMarker = useCallback(
    async (markerId, companyId) => {
      return createAssignment({
        marker_id: markerId,
        company_id: companyId,
        // Note: booth_number removed - now using glyphText from Markers_Appearance
      });
    },
    [createAssignment]
  );

  // Unassign company from marker
  const unassignCompanyFromMarker = useCallback(
    async (markerId, companyId) => {
      try {
        const { error: deleteError } = await supabase
          .from('assignments')
          .delete()
          .eq('marker_id', markerId)
          .eq('company_id', companyId)
          .eq('event_year', eventYear);

        if (deleteError) throw deleteError;

        setAssignments((prev) =>
          prev.filter((a) => !(a.marker_id === markerId && a.company_id === companyId))
        );
        return { error: null };
      } catch (err) {
        console.error('Error unassigning company:', err);
        return { error: err.message };
      }
    },
    [eventYear]
  );

  // Get assignments for a specific marker
  const getMarkerAssignments = useCallback(
    (markerId) => {
      return assignments.filter((a) => a.marker_id === markerId);
    },
    [assignments]
  );

  // Get assignments for a specific company
  const getCompanyAssignments = useCallback(
    (companyId) => {
      return assignments.filter((a) => a.company_id === companyId);
    },
    [assignments]
  );

  // Archive current year and prepare for next year
  const archiveCurrentYear = useCallback(async () => {
    try {
      // Call Supabase function to archive
      const { data, error: archiveError } = await supabase.rpc('archive_assignments', {
        year_to_archive: eventYear,
      });

      if (archiveError) throw archiveError;

      setAssignments([]);
      return { data, error: null };
    } catch (err) {
      console.error('Error archiving assignments:', err);
      return { data: null, error: err.message };
    }
  }, [eventYear]);

  // Load archived assignments for a specific year
  const loadArchivedAssignments = useCallback(async (year) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('assignments_archive')
        .select(
          `
          *,
          company:companies(id, name, logo, website, info, company_translations(language_code, info))
        `
        )
        .eq('event_year', year)
        .order('marker_id', { ascending: true });

      if (fetchError) throw fetchError;

      return { data, error: null };
    } catch (err) {
      console.error('Error loading archived assignments:', err);
      return { data: null, error: err.message };
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  // Reload assignments when eventYear changes
  useEffect(() => {
    loadAssignments();
  }, [eventYear, loadAssignments]);

  // Subscribe to realtime changes - filter by event year
  useEffect(() => {
    const channel = supabase
      .channel(`assignments-changes-${eventYear}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'assignments',
          filter: `event_year=eq.${eventYear}`,
        },
        (payload) => {
          // For INSERT events, check if we already have this assignment locally
          // (it was created by us, not another user)
          if (payload.eventType === 'INSERT' && payload.new) {
            setAssignments((prev) => {
              // Check if this assignment already exists
              const exists = prev.some(a => a.id === payload.new.id);
              if (exists) {
                // We already have it (we created it locally), no need to reload
                return prev;
              }
              // New assignment from another user/session, reload to get full data
              loadAssignments();
              return prev;
            });
          } else {
            // For UPDATE/DELETE, always reload
            loadAssignments();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventYear, loadAssignments]);

  return {
    assignments,
    loading,
    error,
    createAssignment,
    updateAssignment,
    deleteAssignment,
    assignCompanyToMarker,
    unassignCompanyFromMarker,
    getMarkerAssignments,
    getCompanyAssignments,
    archiveCurrentYear,
    loadArchivedAssignments,
    reload: loadAssignments,
  };
}
