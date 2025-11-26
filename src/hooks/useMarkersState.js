import { useState, useCallback, useEffect } from 'react';

/**
 * Custom hook to manage an array of marker objects and their state.
 * Automatically syncs with incoming markers from useEventMarkers.
 * @param {Array} markers - Array of marker objects from data source.
 * @returns {[Array, Function, Function]} - [markersState, updateMarker, setMarkersState]
 */
export default function useMarkersState(markers = []) {
  const [markersState, setMarkersState] = useState(markers);

  // Sync markersState with incoming markers from useEventMarkers real-time updates
  useEffect(() => {
    if (Array.isArray(markers)) {
      setMarkersState(markers);
    }
  }, [markers]);
  const coreFields = ['id', 'lat', 'lng', 'rectangle', 'angle', 'coreLocked'];
  const appearanceFields = [
    'iconUrl',
    'iconSize',
    'iconColor',
    'className',
    'prefix',
    'glyph',
    'glyphColor',
    'glyphSize',
    'glyphAnchor',
    'appearanceLocked',
  ];
  const contentFields = ['name', 'logo', 'website', 'info', 'contentLocked'];
  // Note: Admin fields (contact, phone, meals, etc.) now managed via Event_Subscriptions

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
        await supabase.from(table).insert([row]);
        return true;
      }
      return true;
    }
    // Ensure id is always an integer for Supabase queries
    const intId = typeof id === 'string' && id.startsWith('m') ? parseInt(id.slice(1), 10) : id;
    setMarkersState((prev) =>
      prev.map((marker) => (marker.id === id ? { ...marker, ...newProps } : marker)),
    );
    try {
      const { supabase } = await import('../supabaseClient');
      // Ensure marker exists in all tables before update/fetch
      const tables = [
        { name: 'Markers_Core', fields: coreFields },
        { name: 'Markers_Appearance', fields: appearanceFields },
        { name: 'Markers_Content', fields: contentFields },
      ];
      for (const { name: table } of tables) {
        await ensureMarkerRow(supabase, table, intId);
      }
      // Group fields by table for batched updates
      const coreUpdates = {};
      const appearanceUpdates = {};
      const contentUpdates = {};

      for (const [key, value] of Object.entries(newProps)) {
        if (coreFields.includes(key)) {
          coreUpdates[key] = value;
        } else if (appearanceFields.includes(key)) {
          appearanceUpdates[key] = value;
        } else if (contentFields.includes(key)) {
          contentUpdates[key] = value;
        }
        // Note: Admin fields are managed via Event_Subscriptions, not Markers_Admin
      }

      // Batch update each table once (instead of per-field)
      if (Object.keys(coreUpdates).length > 0) {
        await supabase.from('Markers_Core').update(coreUpdates).eq('id', intId);
      }
      if (Object.keys(appearanceUpdates).length > 0) {
        await supabase.from('Markers_Appearance').update(appearanceUpdates).eq('id', intId);
      }
      if (Object.keys(contentUpdates).length > 0) {
        await supabase.from('Markers_Content').update(contentUpdates).eq('id', intId);
      }
    } catch (err) {
      // Silently ignore errors in production
    }
  }, []);

  return [markersState, updateMarker, setMarkersState];
}
