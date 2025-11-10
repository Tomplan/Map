import { supabase } from '../supabaseClient';
import { FIELD_TABLE_MAP, LOCK_FIELDS } from '../config/markerTableConfig';

// Fields that belong to companies table
const COMPANY_FIELDS = ['name', 'logo', 'website', 'info'];

// Fields that belong to assignments table
const ASSIGNMENT_FIELDS = ['boothNumber'];

/**
 * Update a marker field in Supabase
 * Handles split architecture:
 * - Markers < 1000 (Company booths): Use Companies/Assignments tables
 * - Markers >= 1000 (Special markers): Use Markers_Content table
 * - Core/Appearance/Admin: Use original tables for all markers
 * @param {number} id - Marker ID
 * @param {string} key - Field name
 * @param {*} value - New value
 * @param {number} eventYear - Current event year (for assignments)
 * @returns {Promise<{error: Error | null}>}
 */
export async function updateMarkerField(id, key, value, eventYear = new Date().getFullYear()) {
  try {
    // Lock fields must always be boolean
    let sendValue = value;
    if (!LOCK_FIELDS.includes(key)) {
      // For non-lock fields, treat empty string, empty array, or undefined as null
      if (value === '' || value === undefined || (Array.isArray(value) && value.length === 0)) {
        sendValue = null;
      }
    }

    // For booth markers (< 1000), route company fields to Companies/Assignments tables
    if (id < 1000) {
      // Handle company fields - update via companies table
      if (COMPANY_FIELDS.includes(key)) {
        return await updateCompanyField(id, key, sendValue, eventYear);
      }

      // Handle assignment fields - update via assignments table
      if (ASSIGNMENT_FIELDS.includes(key)) {
        return await updateAssignmentField(id, key, sendValue, eventYear);
      }
    } else {
      // For special markers (>= 1000), content fields go directly to Markers_Content
      if (COMPANY_FIELDS.includes(key) || ASSIGNMENT_FIELDS.includes(key)) {
        const { error } = await supabase
          .from('Markers_Content')
          .update({ [key]: sendValue })
          .eq('id', id);

        if (error) {
          console.error(`Failed to update ${key} for special marker ${id}:`, error);
          return { error };
        }

        return { error: null };
      }
    }

    // For other fields (Core, Appearance, Admin), use original table mapping
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
 * Update a company field for a marker's assignment
 * @param {number} markerId - Marker ID
 * @param {string} key - Company field name
 * @param {*} value - New value
 * @param {number} eventYear - Current event year
 * @returns {Promise<{error: Error | null}>}
 */
async function updateCompanyField(markerId, key, value, eventYear) {
  try {
    // Get the assignment for this marker in the current year
    const { data: assignments, error: fetchError } = await supabase
      .from('assignments')
      .select('company_id')
      .eq('marker_id', markerId)
      .eq('event_year', eventYear)
      .limit(1);

    if (fetchError) {
      console.error(`Failed to fetch assignment for marker ${markerId}:`, fetchError);
      return { error: fetchError };
    }

    if (!assignments || assignments.length === 0) {
      console.warn(`No assignment found for marker ${markerId} in year ${eventYear}`);
      return { error: new Error('No assignment found') };
    }

    const companyId = assignments[0].company_id;

    // Update the company field
    const { error } = await supabase
      .from('companies')
      .update({ [key]: value })
      .eq('id', companyId);

    if (error) {
      console.error(`Failed to update ${key} for company ${companyId}:`, error);
      return { error };
    }

    return { error: null };
  } catch (error) {
    console.error(`Exception updating company field ${key}:`, error);
    return { error };
  }
}

/**
 * Update an assignment field (booth number)
 * @param {number} markerId - Marker ID
 * @param {string} key - Assignment field name
 * @param {*} value - New value
 * @param {number} eventYear - Current event year
 * @returns {Promise<{error: Error | null}>}
 */
async function updateAssignmentField(markerId, key, value, eventYear) {
  try {
    // Map field name to assignment column
    const columnMap = {
      boothNumber: 'booth_number',
    };

    const column = columnMap[key] || key;

    // Update the assignment
    const { error } = await supabase
      .from('assignments')
      .update({ [column]: value })
      .eq('marker_id', markerId)
      .eq('event_year', eventYear);

    if (error) {
      console.error(`Failed to update ${key} for marker ${markerId}:`, error);
      return { error };
    }

    return { error: null };
  } catch (error) {
    console.error(`Exception updating assignment field ${key}:`, error);
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
