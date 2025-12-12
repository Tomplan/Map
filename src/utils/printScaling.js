import { getIconSizeForZoom } from './markerSizing';
import { normalizeIconSize } from './iconSizeHelpers';
import { MAP_CONFIG } from '../config/mapConfig';

/**
 * Compute scaled icon options for print maps given original icon options
 * and the print map zoom.
 * Returns a copy of icon options with recomputed iconSize, iconAnchor,
 * shadow sizes, glyphSize and glyphAnchor suitable for the print zoom.
 */
export function computePrintIconOptions(iconOpts, printZoom, isAdminView = false) {
  if (!iconOpts) return iconOpts;

  // Determine base size from stored baseIconSize or fallback to the default size
  // IMPORTANT: do NOT fall back to iconOpts.iconSize — that may be the UI-scaled size
  // (which depends on current zoom) and would reintroduce print-size dependence on
  // the user's current zoom. Prefer the canonical baseIconSize, otherwise use global default.
  const defaultSize = MAP_CONFIG.MARKER_SIZING.DEFAULT_SIZE || [25, 41];
  const baseSize = normalizeIconSize(iconOpts.baseIconSize || defaultSize, defaultSize);

  // Determine if this is a special marker based on className (conservative approach)
  const isSpecial = (iconOpts.className || '').includes('special-marker');

  // Compute new icon size using same routine used by the live map sizing
  const newSize = getIconSizeForZoom(printZoom, baseSize, isSpecial, isAdminView);

  // Compute shadow size proportionally (default Leaflet scale relationship preserved)
  const shadowWidth = Math.round(newSize[0] * (41 / 25));
  const shadowHeight = Math.round(newSize[1] * (41 / 41));
  const shadowAnchorX = Math.round((shadowWidth * 12) / 41);
  const shadowAnchorY = shadowHeight;

  // Compute scaled glyph size
  let glyphSizeStr = iconOpts.glyphSize || `${Math.round(newSize[1] * 0.33)}px`;
  if (iconOpts.glyphSize) {
    // If a glyphSize was explicitly provided, scale it proportionally
    let baseGlyphPx = null;
    if (typeof iconOpts.glyphSize === 'number') baseGlyphPx = iconOpts.glyphSize;
    else if (typeof iconOpts.glyphSize === 'string')
      baseGlyphPx = parseFloat(iconOpts.glyphSize.replace(/[^0-9.-]/g, ''));

    if (Number.isFinite(baseGlyphPx)) {
      const originalIconHeight =
        (iconOpts.iconSize && iconOpts.iconSize[1]) || baseSize[1] || defaultSize[1];
      const scaled = (newSize[1] * baseGlyphPx) / originalIconHeight;
      glyphSizeStr = `${scaled.toFixed(2)}px`;
    }
  }

  // Compute glyph anchor scaling similar to createMarkerIcon logic
  let glyphAnchor = iconOpts.glyphAnchor || [0, 0];
  try {
    const markerBase = normalizeIconSize(iconOpts.baseIconSize || defaultSize, defaultSize);
    const baseW = markerBase[0] || defaultSize[0];
    const baseH = markerBase[1] || defaultSize[1];
    const scaleX = baseW ? newSize[0] / baseW : 1;
    const scaleY = baseH ? newSize[1] / baseH : 1;
    if (Array.isArray(iconOpts.glyphAnchor) && iconOpts.glyphAnchor.length >= 2) {
      const ax = parseFloat(iconOpts.glyphAnchor[0]) || 0;
      const ay = parseFloat(iconOpts.glyphAnchor[1]) || 0;
      glyphAnchor = [parseFloat((ax * scaleX).toFixed(2)), parseFloat((ay * scaleY).toFixed(2))];
    } else {
      // Default glyph anchor scales proportionally
      const defaultAnchor = iconOpts.glyphAnchor || [0, -5];
      glyphAnchor = [
        parseFloat((defaultAnchor[0] * scaleX).toFixed(2)),
        parseFloat((defaultAnchor[1] * scaleY).toFixed(2)),
      ];
    }
  } catch (e) {
    // Fallback to original
    glyphAnchor = iconOpts.glyphAnchor || [0, 0];
  }

  // Compute new icon anchor (bottom center of icon)
  const iconAnchor = [Math.round(newSize[0] / 2), newSize[1]];

  return {
    ...iconOpts,
    iconSize: newSize,
    iconAnchor,
    shadowSize: [shadowWidth, shadowHeight],
    shadowAnchor: [shadowAnchorX, shadowAnchorY],
    glyphSize: glyphSizeStr,
    glyphAnchor,
  };
}

export default { computePrintIconOptions };
