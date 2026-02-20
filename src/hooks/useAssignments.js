import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabaseClient';

/**
 * Hook to manage Assignments (Company-to-Marker mappings per year)
 */
export default function useAssignments(eventYear = new Date().getFullYear()) {
  // shared cache keyed by year
  if (!useAssignments.cache) useAssignments.cache = new Map();
  let entry = useAssignments.cache.get(eventYear);
  if (!entry) {
    entry = {
      state: { assignments: [], loading: true, error: null },
      listeners: new Set(),
      refCount: 0,
      channel: null,
      reloadTimeout: null,
      loadPromise: null,
    };
    useAssignments.cache.set(eventYear, entry);
  }

  const [local, setLocal] = useState({
    assignments: entry.state.assignments,
    loading: entry.state.loading,
    error: entry.state.error,
  });

  // Use ref to store current eventYear so real-time subscriptions always use latest value
  const eventYearRef = useRef(eventYear);

  // Update ref whenever eventYear changes
  useEffect(() => {
    eventYearRef.current = eventYear;
  }, [eventYear]);

  // Load assignments for specific year
  const loadAssignments = useCallback(async () => {
    // prevent parallel fetches
    if (entry.loadPromise) return entry.loadPromise;

    entry.state.loading = true;
    entry.state.error = null;
    entry.listeners.forEach((l) => l(entry.state));

    entry.loadPromise = (async () => {
      try {
        const targetYear = eventYear; // safe because entry is per-year

        // first get valid marker IDs for this year
        const { data: validMarkers, error: markersError } = await supabase
          .from('markers_core')
          .select('id')
          .eq('event_year', targetYear);
        if (markersError) throw markersError;

        const validMarkerIds = validMarkers?.map((m) => m.id) || [];

        // then fetch assignments filtered by those markers
        const { data, error: fetchError } = await supabase
          .from('assignments')
          .select(
            `
          *,
          company:companies(id, name, logo, website, info, company_translations(language_code, info)),
          marker:markers_core(id, lat, lng)
        `,
          )
          .eq('event_year', targetYear)
          .in('marker_id', validMarkerIds)
          .order('marker_id', { ascending: true });
        if (fetchError) throw fetchError;

        entry.state.assignments = data || [];
      } catch (err) {
        console.error('Error loading assignments:', err);
        entry.state.error = err.message;
      } finally {
        entry.state.loading = false;
        entry.listeners.forEach((l) => l(entry.state));
        entry.loadPromise = null;
      }
    })();

    return entry.loadPromise;
  }, [eventYear]);

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
        `,
          )
          .single();

        if (insertError) throw insertError;

        await loadAssignments();
        return { data, error: null };
      } catch (err) {
        console.error('Error creating assignment:', err);
        return { data: null, error: err.message };
      }
    },
    [eventYear, loadAssignments],
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
        `,
        )
        .single();

      if (updateError) throw updateError;

      await loadAssignments();
      return { data, error: null };
    } catch (err) {
      console.error('Error updating assignment:', err);
      return { data: null, error: err.message };
    }
  }, [loadAssignments]);

  // Delete assignment
  const deleteAssignment = useCallback(async (id) => {
    try {
      const { error: deleteError } = await supabase.from('assignments').delete().eq('id', id);

      if (deleteError) throw deleteError;

      await loadAssignments();
      return { error: null };
    } catch (err) {
      console.error('Error deleting assignment:', err);
      return { error: err.message };
    }
  }, [loadAssignments]);

  // Assign company to marker
  const assignCompanyToMarker = useCallback(
    async (markerId, companyId) => {
      return createAssignment({
        marker_id: markerId,
        company_id: companyId,
        // Note: booth_number removed - now using glyphText from Markers_Appearance
      });
    },
    [createAssignment],
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

        await loadAssignments();
        return { error: null };
      } catch (err) {
        console.error('Error unassigning company:', err);
        return { error: err.message };
      }
    },
    [eventYear, loadAssignments],
  );

  // Get assignments for a specific marker
  const getMarkerAssignments = useCallback(
    (markerId) => {
      return local.assignments.filter((a) => a.marker_id === markerId);
    },
    [local.assignments],
  );

  // Get assignments for a specific company
  const getCompanyAssignments = useCallback(
    (companyId) => {
      return local.assignments.filter((a) => a.company_id === companyId);
    },
    [local.assignments],
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
        `,
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

  // hook instance lifecycle: register listener / kick off load / manage channel
  useEffect(() => {
    // update entry reference if year changed
    entry = useAssignments.cache.get(eventYear);

    entry.refCount += 1;
    const listener = (s) =>
      setLocal({
        assignments: s.assignments,
        loading: s.loading,
        error: s.error,
      });
    entry.listeners.add(listener);

    // sync current state
    setLocal({
      assignments: entry.state.assignments,
      loading: entry.state.loading,
      error: entry.state.error,
    });
    if (entry.state.loading && entry.refCount === 1) {
      loadAssignments();
    }

    // start realtime channel if first subscriber
    if (!entry.channel) {
      entry.channel = supabase
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
            if (payload.eventType === 'INSERT' && payload.new) {
              // insert could come from self, just reload to keep logic simple
              entry.reloadTimeout && clearTimeout(entry.reloadTimeout);
              entry.reloadTimeout = setTimeout(loadAssignments, 500);
            } else {
              entry.reloadTimeout && clearTimeout(entry.reloadTimeout);
              entry.reloadTimeout = setTimeout(loadAssignments, 500);
            }
          },
        )
        .subscribe();
    }

    return () => {
      entry.listeners.delete(listener);
      entry.refCount -= 1;
      if (entry.refCount <= 0) {
        if (entry.channel) supabase.removeChannel(entry.channel);
        useAssignments.cache.delete(eventYear);
      }
      if (entry.reloadTimeout) clearTimeout(entry.reloadTimeout);
    };
  }, [eventYear, loadAssignments]);

  return {
    assignments: local.assignments,
    loading: local.loading,
    error: local.error,
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
