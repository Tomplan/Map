import { useState, useCallback } from 'react';

/**
 * Custom hook to manage an array of marker objects and their state.
 * @param {Array} initialMarkers - Array of marker objects from data source.
 * @returns {[Array, Function, Function]} - [markersState, updateMarker, setMarkersState]
 */
export default function useMarkersState(initialMarkers = []) {
  const [markersState, setMarkersState] = useState(initialMarkers);
  const coreFields = [
    'id', 'lat', 'lng', 'rectangle', 'angle', 'coreLocked'
  ];
  const appearanceFields = [
    'iconUrl', 'iconSize', 'iconColor', 'className', 'prefix', 'glyph', 'glyphColor', 'glyphSize', 'glyphAnchor', 'appearanceLocked'
  ];
  const contentFields = [
    'boothNumber', 'name', 'logo', 'website', 'info', 'contentLocked'
  ];
  const adminFields = [
    'contact', 'phone', 'email', 'boothCount', 'area', 'coins', 'breakfast', 'lunch', 'bbq', 'notes', 'adminLocked'
  ];

  // Update a marker by id, merging new props and syncing to Supabase
  const updateMarker = useCallback(async (id, newProps) => {
    setMarkersState((prev) =>
      prev.map((marker) =>
        marker.id === id ? { ...marker, ...newProps } : marker
      )
    );
    try {
      const { supabase } = await import('../supabaseClient');
      for (const [key, value] of Object.entries(newProps)) {
        let table = null;
        if (coreFields.includes(key)) {
          table = 'Markers_Core';
        } else if (appearanceFields.includes(key)) {
          table = 'Markers_Appearance';
        } else if (contentFields.includes(key)) {
          table = 'Markers_Content';
        } else if (adminFields.includes(key)) {
          table = 'Markers_Admin';
        }
        if (table) {
          const { error } = await supabase
            .from(table)
            .update({ [key]: value })
            .eq('id', id);
          if (error) {
            console.error(`Supabase update failed for ${key} in ${table}:`, error);
          } else {
            // Fetch the updated row to confirm the value
            const { data, error: fetchError } = await supabase
              .from(table)
              .select(key)
              .eq('id', id)
              .single();
            if (fetchError) {
              console.error(`Supabase fetch failed for ${key} in ${table}:`, fetchError);
            } else {
              if (data && data[key] === value) {
                console.log(`Confirmed value for ${key} in ${table}:`, data[key]);
              } else {
                console.warn(`Value mismatch for ${key} in ${table}: expected`, value, 'got', data ? data[key] : undefined);
              }
            }
          }
        } else {
          console.warn(`Unknown field "${key}" not synced to Supabase.`);
        }
      }
    } catch (err) {
      console.error('Supabase update error (offline or import failed):', err);
    }
  }, []);

  return [markersState, updateMarker, setMarkersState];
}
