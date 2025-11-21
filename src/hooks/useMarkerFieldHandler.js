import { useCallback } from 'react';
import { supabase } from '../supabaseClient';

/**
 * Hook for handling marker field changes with table routing and validation
 *
 * @param {Function} setMarkersState - State setter function for markers
 * @returns {Function} handleFieldChange - Function to handle field changes
 */
export function useMarkerFieldHandler(setMarkersState) {
  const handleFieldChange = useCallback(async (id, key, value) => {
    // Lock fields must always be boolean
    const lockFields = ['coreLocked', 'appearanceLocked', 'contentLocked'];
    let sendValue = value;

    if (!lockFields.includes(key)) {
      // For non-lock fields, treat empty string, empty array, or undefined as null
      if (value === '' || value === undefined || (Array.isArray(value) && value.length === 0)) {
        sendValue = null;
      }
    }

    // Update local state immediately
    setMarkersState((prev) => {
      const updated = prev.map((m) => (m.id === id ? { ...m, [key]: sendValue } : m));
      return updated;
    });

    // Determine which table to update based on field
    let table = 'Markers_Core';

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
    ];

    const contentFields = ['name', 'logo', 'website', 'info'];

    // Note: Admin fields (contact, phone, meals, etc.) are now managed via Event_Subscriptions

    if (appearanceFields.includes(key)) {
      table = 'Markers_Appearance';
    } else if (contentFields.includes(key)) {
      table = 'Markers_Content';
    }

    // Sync to Supabase
    const { error } = await supabase
      .from(table)
      .update({ [key]: sendValue })
      .eq('id', id);

    if (error) {
      console.error(`Error updating ${table}.${key}:`, error);
    }
  }, [setMarkersState]);

  return handleFieldChange;
}
