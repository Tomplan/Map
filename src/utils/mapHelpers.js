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
  // If coreLocked is strictly true, it's locked.
  // If coreLocked is false, null, or undefined, it's NOT locked.
  const isLocked = marker && marker.coreLocked === true;
  return isAdminView && marker && !isLocked;
};
