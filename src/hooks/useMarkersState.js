import { useState, useCallback } from 'react';

/**
 * Custom hook to manage an array of marker objects and their state.
 * @param {Array} initialMarkers - Array of marker objects from data source.
 * @returns {[Array, Function, Function]} - [markersState, updateMarker, setMarkersState]
 */
export default function useMarkersState(initialMarkers = []) {
  const [markersState, setMarkersState] = useState(initialMarkers);

  // Update a marker by id, merging new props and syncing to Supabase
  const updateMarker = useCallback(async (id, newProps) => {
    setMarkersState((prev) =>
      prev.map((marker) =>
        marker.id === id ? { ...marker, ...newProps } : marker
      )
    );
    try {
      // Dynamically import supabase to avoid circular deps if needed
      const { supabase } = await import('../supabaseClient');
      // If updating angle, use Markers_Appearance table
      if ('angle' in newProps) {
        const { error } = await supabase
          .from('Markers_Appearance')
          .update({ angle: newProps.angle })
          .eq('id', id);
        if (error) {
          console.error('Supabase update failed:', error);
        }
      } else {
        const { error } = await supabase
          .from('Markers_Core')
          .update(newProps)
          .eq('id', id);
        if (error) {
          console.error('Supabase update failed:', error);
        }
      }
    } catch (err) {
      console.error('Supabase update error (offline or import failed):', err);
    }
  }, []);

  return [markersState, updateMarker, setMarkersState];
}
