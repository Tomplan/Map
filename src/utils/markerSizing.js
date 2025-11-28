import { MAP_CONFIG } from '../config/mapConfig';

/**
 * Get the appropriate icon size for a given zoom level
 * @param {number} zoom - Current map zoom level
 * @param {Array<number>} baseSize - Base icon size [width, height] from marker data
 * @param {boolean} isSpecial - Whether this is a special marker (ID >= 1001)
 * @param {boolean} isAdminView - Whether in admin view (sizing disabled)
 * @returns {Array<number>} Icon size [width, height]
 */
export function getIconSizeForZoom(zoom, baseSize, isSpecial = false, isAdminView = false) {
  const config = MAP_CONFIG.MARKER_SIZING;

  // Debug logging removed — only keep errors in production code

  // If feature disabled or in admin view, return base size
  if (!config || !config.ENABLED || (isAdminView && !config.APPLY_IN_ADMIN)) {
    const fallback = baseSize || (config ? config.DEFAULT_SIZE : [25, 41]);
    // feature disabled: returning fallback
    return fallback;
  }

  // Find the appropriate zoom bucket
  const bucket = config.ZOOM_BUCKETS.find(
    (b) => zoom >= b.minZoom && zoom <= b.maxZoom
  );

  // found bucket (debug logging removed)

  // Fallback to default size if no bucket matches
  let size = bucket ? bucket.size : config.DEFAULT_SIZE;

  // If marker provided its own base size, scale bucket size proportionally
  // so per-marker "base" sizes are respected while still using global bucket values
  try {
    if (Array.isArray(baseSize) && baseSize.length === 2 && config.DEFAULT_SIZE && Array.isArray(config.DEFAULT_SIZE)) {
      const defaultRefHeight = config.DEFAULT_SIZE[1] || config.DEFAULT_SIZE[0] || 41;
      const baseHeight = baseSize[1] || baseSize[0] || defaultRefHeight;
      const scaleFactor = baseHeight / defaultRefHeight;
      size = [Math.round(size[0] * scaleFactor), Math.round(size[1] * scaleFactor)];
    }
  } catch (err) {
    // If scaling fails, fall back gracefully to bucket/default size
    console.warn('[markerSizing] failed to compute scaled size from baseSize', err);
  }

  // Apply special marker multiplier
  if (isSpecial && config.SPECIAL_MARKER_MULTIPLIER) {
    size = [
      Math.round(size[0] * config.SPECIAL_MARKER_MULTIPLIER),
      Math.round(size[1] * config.SPECIAL_MARKER_MULTIPLIER),
    ];
  }

  // returning size
  return size;
}

/**
 * Get zoom bucket identifier for cache keying
 * @param {number} zoom - Current map zoom level
 * @returns {string} Bucket identifier (e.g., "14-17.5")
 */
export function getZoomBucket(zoom) {
  const config = MAP_CONFIG.MARKER_SIZING;

  if (!config.ENABLED) {
    return 'default';
  }

  const bucket = config.ZOOM_BUCKETS.find(
    (b) => zoom >= b.minZoom && zoom <= b.maxZoom
  );

  return bucket ? `${bucket.minZoom}-${bucket.maxZoom}` : 'default';
}

/**
 * Compute a scale factor between two zooms for a given base icon size.
 * Returns the ratio of icon width at targetZoom to icon width at baseZoom.
 */
export function getScaleBetweenZooms(baseZoom, targetZoom, baseSize, isSpecial = false, isAdminView = false) {
  try {
    const base = getIconSizeForZoom(baseZoom, baseSize, isSpecial, isAdminView);
    const target = getIconSizeForZoom(targetZoom, baseSize, isSpecial, isAdminView);
    const baseW = (base && base[0]) || 1;
    const targetW = (target && target[0]) || baseW;
    return baseW > 0 ? targetW / baseW : 1;
  } catch (err) {
    return 1;
  }
}
