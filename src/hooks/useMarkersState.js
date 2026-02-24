import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { updateMarkerField } from '../services/markerUpdateService';

const CORE_FIELDS = ['id', 'lat', 'lng', 'rectangle', 'angle', 'coreLocked'];
const APPEARANCE_FIELDS = [
  'iconUrl',
  'iconSize',
  'iconColor',
  'className',
  'prefix',
  'glyph',
  'glyphColor',
  'glyphSize',
  'shadowScale',
  'glyphAnchor',
  'appearanceLocked',
  'fontWeight',
  'fontStyle',
  'textDecoration',
  'fontFamily',
];
const CONTENT_FIELDS = ['name', 'logo', 'website', 'info', 'contentLocked'];

/**
 * Custom hook to manage an array of marker objects and their state.
 * Automatically syncs with incoming markers from useEventMarkers.
 * @param {Array} markers - Array of marker objects from data source.
 * @returns {[Array, Function, Function]} - [markersState, updateMarker, setMarkersState]
 */
export default function useMarkersState(markers = [], selectedYear = new Date().getFullYear()) {
  const [markersState, setMarkersState] = useState(markers);
  const [historyStack, setHistoryStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  // Sync markersState with incoming markers from useEventMarkers real-time updates
  useEffect(() => {
    if (Array.isArray(markers)) {
      setMarkersState(markers);
    }
  }, [markers]);

  // Note: Admin fields (contact, phone, meals, etc.) now managed via Event_Subscriptions

  // Update a marker by id, merging new props and syncing to Supabase
  const updateMarker = useCallback(
    async (id, newProps, addToHistory = true) => {
      // Helper: ensure marker exists in table
      async function ensureMarkerRow(supabase, table, intId) {
        const { data: exists, error: existsError } = await supabase
          .from(table)
          .select('id')
          .eq('id', intId);
        if (!existsError && (!exists || exists.length === 0)) {
          // Insert with default values for NOT NULL columns
          let row = { id: intId, event_year: selectedYear };
          if (table === 'markers_core') row.coreLocked = false;
          if (table === 'markers_appearance') row.appearanceLocked = false;
          if (table === 'markers_content') row.contentLocked = false;
          await supabase.from(table).insert([row]);
          return true;
        }
        return true;
      }
      // Ensure id is always an integer for Supabase queries
      const intId = typeof id === 'string' && id.startsWith('m') ? parseInt(id.slice(1), 10) : id;

      // Capture previous state for history
      if (addToHistory) {
        setMarkersState((currentMarkers) => {
          const targetMarker = currentMarkers.find((m) => m.id === id);
          if (targetMarker) {
            // Only store the fields that are being changed
            const previousProps = {};
            Object.keys(newProps).forEach((key) => {
              previousProps[key] = targetMarker[key];
            });

            setHistoryStack((prev) => [
              ...prev,
              { id, previousProps, newProps: { ...newProps }, timestamp: Date.now() },
            ]);
            setRedoStack([]); // Clear redo stack on new action
          }
          // Return same markers to not trigger update yet (handled by next setMarkersState)
          return currentMarkers;
        });
      }

      setMarkersState((prev) =>
        prev.map((marker) => (marker.id === id ? { ...marker, ...newProps } : marker)),
      );
      try {
        const { supabase } = await import('../supabaseClient');
        // Ensure marker exists in all tables before update/fetch
        const tables = [
          { name: 'markers_core', fields: CORE_FIELDS },
          { name: 'markers_appearance', fields: APPEARANCE_FIELDS },
          { name: 'markers_content', fields: CONTENT_FIELDS },
        ];
        for (const { name: table } of tables) {
          await ensureMarkerRow(supabase, table, intId);
        }
        // Group fields by table for batched updates
        const coreUpdates = {};
        const appearanceUpdates = {};
        const contentUpdates = {};

        for (const [key, value] of Object.entries(newProps)) {
          if (CORE_FIELDS.includes(key)) {
            coreUpdates[key] = value;
          } else if (APPEARANCE_FIELDS.includes(key)) {
            appearanceUpdates[key] = value;
          } else if (CONTENT_FIELDS.includes(key)) {
            contentUpdates[key] = value;
          }
          // Note: Admin fields are managed via Event_Subscriptions, not Markers_Admin
        }

        // Update each field individually using the proper service with event_year filtering
        const allUpdates = { ...coreUpdates, ...appearanceUpdates, ...contentUpdates };
        for (const [key, value] of Object.entries(allUpdates)) {
          await updateMarkerField(intId, key, value, selectedYear);
        }
      } catch (err) {
        // Silently ignore errors in production
      }
    },
    [selectedYear],
  );

  const undo = useCallback(() => {
    // Return promise to allow awaiting
    return new Promise((resolve) => {
      setMarkersState((currentMarkers) => {
        setHistoryStack((prevStack) => {
          if (prevStack.length === 0) {
            resolve(false);
            return prevStack;
          }

          const lastAction = prevStack[prevStack.length - 1];
          const newStack = prevStack.slice(0, -1);

          // Add to redo stack with current timestamp to track redo order
          setRedoStack((prev) => [...prev, { ...lastAction, timestamp: Date.now() }]);

          // Update marker state locally
          const updatedMarkers = currentMarkers.map((m) =>
            m.id === lastAction.id ? { ...m, ...lastAction.previousProps } : m
          );
          
          // Perform the update with previous props (async, but we don't await here for UI update)
          updateMarker(lastAction.id, lastAction.previousProps, false);
          
          resolve(true);
          return newStack;
        });
        return currentMarkers; // State update happens in the inner callback or separate effect
      });
    });
  }, [updateMarker]);

  const redo = useCallback(() => {
    return new Promise((resolve) => {
      setRedoStack((prevStack) => {
        if (prevStack.length === 0) {
          resolve(false);
          return prevStack;
        }

        const lastAction = prevStack[prevStack.length - 1];
        const newStack = prevStack.slice(0, -1);

        // Add back to history stack
        setHistoryStack((prev) => [...prev, { ...lastAction, timestamp: Date.now() }]);

        // Perform the update with NEW props (re-apply change)
        updateMarker(lastAction.id, lastAction.newProps, false);
        
        resolve(true);
        return newStack;
      });
    });
  }, [updateMarker]);

  const deleteMarker = useCallback(async (id) => {
    // 1. Optimistic UI update
    const originalMarkers = [...markersState];
    setMarkersState((prev) => prev.filter((m) => m.id !== id));

    // 2. Perform DB deletion
    // We must manually delete from related tables first because ON DELETE CASCADE is not set up
    // in the database schema for these relationships.
    try {
      // Delete from assignments first (referencing table)
      const { error: assignError } = await supabase
        .from('assignments')
        .delete()
        .eq('marker_id', id);
      
      if (assignError) throw assignError;

      // Delete from extension tables (shared PK)
      const { error: appError } = await supabase
        .from('markers_appearance')
        .delete()
        .eq('id', id);
      
      if (appError) throw appError;

      const { error: contentError } = await supabase
        .from('markers_content')
        .delete()
        .eq('id', id);
      
      if (contentError) throw contentError;

      // Finally delete from core table
      const { error: coreError } = await supabase
        .from('markers_core')
        .delete()
        .eq('id', id);

      if (coreError) throw coreError;
      
      return { error: null };
    } catch (error) {
      console.error('Error deleting marker:', error);
      // 3. Rollback on error
      setMarkersState(originalMarkers);
      return { error };
    }
  }, [markersState]);

  const canUndo = historyStack.length > 0;
  const canRedo = redoStack.length > 0;

  // Expose stacks for coordination
  return {
    markersState,
    updateMarker,
    deleteMarker,
    setMarkersState,
    undo,
    canUndo,
    redo,
    canRedo,
    historyStack,
    redoStack
  };
}
