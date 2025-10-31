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
    // Helper: ensure marker exists in table
    async function ensureMarkerRow(supabase, table, intId) {
      const { data: exists, error: existsError } = await supabase
        .from(table)
        .select('id')
        .eq('id', intId);
      if (!existsError && (!exists || exists.length === 0)) {
        // Insert with default values for NOT NULL columns
        let row = { id: intId };
        if (table === 'Markers_Core') row.coreLocked = false;
        if (table === 'Markers_Appearance') row.appearanceLocked = false;
        if (table === 'Markers_Content') row.contentLocked = false;
        if (table === 'Markers_Admin') row.adminLocked = false;
        const { error: insertError } = await supabase.from(table).insert([row]);
        if (insertError) {
          console.error(`Supabase insert failed for id in ${table}:`, insertError);
          return false;
        }
        return true;
      }
      return true;
    }
    // Ensure id is always an integer for Supabase queries
    const intId = typeof id === 'string' && id.startsWith('m') ? parseInt(id.slice(1), 10) : id;
    setMarkersState((prev) =>
      prev.map((marker) =>
        marker.id === id ? { ...marker, ...newProps } : marker
      )
    );
    try {
      const { supabase } = await import('../supabaseClient');
      // Ensure marker exists in all tables before update/fetch
      const tables = [
        { name: 'Markers_Core', fields: coreFields },
        { name: 'Markers_Appearance', fields: appearanceFields },
        { name: 'Markers_Content', fields: contentFields },
        { name: 'Markers_Admin', fields: adminFields }
      ];
      for (const { name: table } of tables) {
        await ensureMarkerRow(supabase, table, intId);
      }
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
          // Ensure marker exists before update/fetch
          const exists = await ensureMarkerRow(supabase, table, intId);
          if (!exists) continue;
          const { error } = await supabase
            .from(table)
            .update({ [key]: value })
            .eq('id', intId);
          if (error) {
            console.error(`Supabase update failed for ${key} in ${table}:`, error);
          } else {
            // Fetch the updated row to confirm the value
            const { data, error: fetchError } = await supabase
              .from(table)
              .select(key)
              .eq('id', intId)
              .single();
            if (fetchError || !data) {
              console.error(`Supabase fetch failed for ${key} in ${table}:`, fetchError || { message: 'No data returned' });
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
