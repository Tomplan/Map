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
  const adminFields = [
    'contact',
    'phone',
    'email',
    'boothCount',
    'area',
    'coins',
    'breakfast',
    'lunch',
    'bbq',
    'notes',
    'adminLocked',
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
        { name: 'Markers_Admin', fields: adminFields },
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
          const exists = await ensureMarkerRow(supabase, table, intId);
          if (!exists) continue;
          await supabase
            .from(table)
            .update({ [key]: value })
            .eq('id', intId);
        }
      }
    } catch (err) {
      // Silently ignore errors in production
    }
  }, []);

  return [markersState, updateMarker, setMarkersState];
}
