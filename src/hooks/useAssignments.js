import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

/**
 * Hook to manage Assignments (Company-to-Marker mappings per year)
 */
export default function useAssignments(eventYear = new Date().getFullYear()) {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load assignments for specific year
  const loadAssignments = useCallback(
    async (year = eventYear) => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('assignments')
          .select(
            `
          *,
          company:companies(id, name, logo, website, info),
          marker:Markers_Core(id, lat, lng)
        `
          )
          .eq('event_year', year)
          .order('marker_id', { ascending: true });

        if (fetchError) throw fetchError;

        setAssignments(data || []);
      } catch (err) {
        console.error('Error loading assignments:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [eventYear]
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
          company:companies(id, name, logo, website, info),
          marker:Markers_Core(id, lat, lng)
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
          company:companies(id, name, logo, website, info),
          marker:Markers_Core(id, lat, lng)
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
    async (markerId, companyId, boothNumber = null) => {
      return createAssignment({
        marker_id: markerId,
        company_id: companyId,
        booth_number: boothNumber,
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
          company:companies(id, name, logo, website, info)
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

  // Subscribe to realtime changes
  useEffect(() => {
    const channel = supabase
      .channel('assignments-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assignments' }, (payload) => {
        console.log('Assignments change:', payload);
        loadAssignments();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadAssignments]);

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
