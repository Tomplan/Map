/**
 * Create searchable text string from marker data
 * @param {Object} marker - Marker object
 * @returns {string} Combined search text
 */
export const createSearchText = (marker) => {
  return [marker.name, marker.glyph, marker.label].filter(Boolean).join(' | ');
};

/**
 * Determine if a marker can be dragged in admin view
 * @param {Object} marker - Marker object
 * @param {boolean} isAdminView - Whether in admin mode
 * @returns {boolean} True if marker is draggable
 */
export const isMarkerDraggable = (marker, isAdminView) => {
  return isAdminView && marker && marker.coreLocked === false;
};
