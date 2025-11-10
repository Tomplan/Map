import { supabase } from '../supabaseClient';
import { FIELD_TABLE_MAP, LOCK_FIELDS } from '../config/markerTableConfig';

/**
 * Update a marker field in Supabase
 * @param {number} id - Marker ID
 * @param {string} key - Field name
 * @param {*} value - New value
 * @returns {Promise<{error: Error | null}>}
 */
export async function updateMarkerField(id, key, value) {
  try {
    // Lock fields must always be boolean
    let sendValue = value;
    if (!LOCK_FIELDS.includes(key)) {
      // For non-lock fields, treat empty string, empty array, or undefined as null
      if (value === '' || value === undefined || (Array.isArray(value) && value.length === 0)) {
        sendValue = null;
      }
    }

    // Determine which table to update
    const table = FIELD_TABLE_MAP[key] || 'Markers_Core';

    // Sync to Supabase
    const { error } = await supabase.from(table).update({ [key]: sendValue }).eq('id', id);

    if (error) {
      console.error(`Failed to update ${key} for marker ${id}:`, error);
      return { error };
    }

    return { error: null };
  } catch (error) {
    console.error(`Exception updating ${key} for marker ${id}:`, error);
    return { error };
  }
}

/**
 * Toggle lock status for a marker field
 * @param {number} id - Marker ID
 * @param {string} lockField - Lock field name (coreLocked, appearanceLocked, etc.)
 * @param {boolean} currentValue - Current lock value
 * @returns {Promise<{error: Error | null}>}
 */
export async function toggleMarkerLock(id, lockField, currentValue) {
  return updateMarkerField(id, lockField, !currentValue);
}

/**
 * Batch update multiple markers' lock status
 * @param {Array<number>} markerIds - Array of marker IDs
 * @param {string} lockField - Lock field name
 * @param {boolean} locked - New lock status
 * @returns {Promise<{error: Error | null}>}
 */
export async function batchUpdateLocks(markerIds, lockField, locked) {
  try {
    const table = FIELD_TABLE_MAP[lockField] || 'Markers_Core';

    const { error } = await supabase
      .from(table)
      .update({ [lockField]: locked })
      .in('id', markerIds);

    if (error) {
      console.error(`Failed to batch update ${lockField}:`, error);
      return { error };
    }

    return { error: null };
  } catch (error) {
    console.error(`Exception in batch update ${lockField}:`, error);
    return { error };
  }
}
