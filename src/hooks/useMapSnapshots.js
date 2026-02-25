import { useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useDialog } from '../contexts/DialogContext';

export default function useMapSnapshots(eventYear) {
  const [snapshots, setSnapshots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { confirm, toastError, toastSuccess } = useDialog();

  const loadSnapshots = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('map_snapshots')
        .select('id, name, description, created_at, created_by, event_year')
        .eq('event_year', eventYear)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSnapshots(data || []);
    } catch (err) {
      console.error('Error loading snapshots:', err);
      setError(err.message);
      toastError('Failed to load snapshots');
    } finally {
      setLoading(false);
    }
  }, [eventYear, toastError]);

  const createSnapshot = useCallback(
    async (name, description) => {
      try {
        setLoading(true);

        // 1. Fetch all current map data
        const [coreRes, appearanceRes, contentRes, assignmentsRes] = await Promise.all([
          supabase.from('markers_core').select('*').eq('event_year', eventYear),
          supabase.from('markers_appearance').select('*').eq('event_year', eventYear),
          supabase.from('markers_content').select('*').eq('event_year', eventYear),
          supabase.from('assignments').select('*').eq('event_year', eventYear),
        ]);

        if (coreRes.error) throw coreRes.error;
        if (appearanceRes.error) throw appearanceRes.error;
        if (contentRes.error) throw contentRes.error;
        if (assignmentsRes.error) throw assignmentsRes.error;

        const snapshotData = {
          markers_core: coreRes.data,
          markers_appearance: appearanceRes.data,
          markers_content: contentRes.data,
          assignments: assignmentsRes.data,
        };

        // 2. Save snapshot
        const { error: insertError } = await supabase.from('map_snapshots').insert({
          event_year: eventYear,
          name,
          description,
          data: snapshotData,
        });

        if (insertError) throw insertError;

        toastSuccess('Snapshot created successfully');
        await loadSnapshots(); // Refresh list
        return true;
      } catch (err) {
        console.error('Error creating snapshot:', err);
        toastError(`Failed to create snapshot: ${err.message}`);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [eventYear, loadSnapshots, toastError, toastSuccess],
  );

  const restoreSnapshot = useCallback(
    async (snapshotId) => {
      const confirmed = await confirm({
        title: 'Restore Snapshot?',
        message:
          'This action will completely overwrite the current map state with the saved snapshot data.\n\nAll current marker positions, styles, and company assignments for this year will be replaced.\n\nAre you sure you want to proceed?',
        confirmText: 'Yes, Restore Snapshot',
        cancelText: 'Cancel',
        variant: 'danger',
      });
      if (!confirmed) return;

      try {
        setLoading(true);

        // 1. Get snapshot data
        const { data: snapshot, error: fetchError } = await supabase
          .from('map_snapshots')
          .select('data')
          .eq('id', snapshotId)
          .single();

        if (fetchError) throw fetchError;
        if (!snapshot?.data) throw new Error('Snapshot data is empty');

        const { markers_core, markers_appearance, markers_content, assignments } = snapshot.data;

        // 2. Clear current state (careful with dependencies!)
        // Delete in order to respect FKs? assignments usually depend on markers.
        // markers tables share IDs.
        // assignments -> markers_core

        // Delete assignments first
        const { error: delAssignError } = await supabase
          .from('assignments')
          .delete()
          .eq('event_year', eventYear);
        if (delAssignError) throw delAssignError;

        // Delete marker data
        // Order: content, appearance, core (core is the parent if FKs exist, check schema)
        // Usually, appearance/content cascade delete if core deletes, or core is dependent.
        // Assuming markers_core is the base.
        const { error: delContentError } = await supabase
          .from('markers_content')
          .delete()
          .eq('event_year', eventYear);
        if (delContentError) throw delContentError;

        const { error: delAppearanceError } = await supabase
          .from('markers_appearance')
          .delete()
          .eq('event_year', eventYear);
        if (delAppearanceError) throw delAppearanceError;

        const { error: delCoreError } = await supabase
          .from('markers_core')
          .delete()
          .eq('event_year', eventYear);
        if (delCoreError) throw delCoreError;

        // 3. Insert snapshot data
        if (markers_core?.length) {
          const { error: insCoreError } = await supabase.from('markers_core').insert(markers_core);
          if (insCoreError) throw insCoreError;
        }

        if (markers_appearance?.length) {
          const { error: insAppError } = await supabase
            .from('markers_appearance')
            .insert(markers_appearance);
          if (insAppError) throw insAppError;
        }

        if (markers_content?.length) {
          const { error: insContError } = await supabase
            .from('markers_content')
            .insert(markers_content);
          if (insContError) throw insContError;
        }

        if (assignments?.length) {
          // Remove IDs to let DB generate new ones? No, keep existing IDs if possible to maintain stable references
          // But if they reference specific companies that might be deleted? (Companies are not year-scoped usually?)
          // Assuming companies persist.
          const { error: insAssignError } = await supabase.from('assignments').insert(assignments);
          if (insAssignError) throw insAssignError;
        }

        toastSuccess('Map state restored successfully');
        return true;
      } catch (err) {
        console.error('Error restoring snapshot:', err);
        toastError(`Failed to restore snapshot: ${err.message}`);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [eventYear, confirm, toastError, toastSuccess],
  );

  const deleteSnapshot = useCallback(
    async (snapshotId) => {
      const confirmed = await confirm('Delete this snapshot permanently?');
      if (!confirmed) return;

      try {
        setLoading(true);
        const { error } = await supabase.from('map_snapshots').delete().eq('id', snapshotId);
        if (error) throw error;

        toastSuccess('Snapshot deleted');
        await loadSnapshots();
      } catch (err) {
        console.error('Error deleting snapshot:', err);
        toastError('Failed to delete snapshot');
      } finally {
        setLoading(false);
      }
    },
    [loadSnapshots, confirm, toastError, toastSuccess],
  );

  return {
    snapshots,
    loading,
    error,
    loadSnapshots,
    createSnapshot,
    restoreSnapshot,
    deleteSnapshot,
  };
}
