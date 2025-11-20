import { getLogoPath } from './getLogoPath';
import { getBaseUrl } from './getBaseUrl';
import L from 'leaflet';
import '../libs/Leaflet.Icon.Glyph.js';
// import removed; use /assets/icons/ URLs for runtime asset access

/**
 * Generate HTML for a marker popup with logo, name, website, and info fields.
 * @param {Object} marker - Marker object with logo, name, website, info fields.
 * @returns {string} HTML string for Leaflet popup.
 */
export function createMarkerPopupHTML(marker) {
  const { logo, name, website, info } = marker;
  const logoPath = logo ? getLogoPath(logo) : '';
  return `
    <div class="marker-popup">
      ${logoPath ? `<img src="${logoPath}" alt="${name || 'Logo'}" class="marker-popup-logo" style="max-width:64px;max-height:64px;margin-bottom:8px;" />` : ''}
      ${name ? `<div class="marker-popup-name" style="font-weight:bold;font-size:1.1em;margin-bottom:4px;">${name}</div>` : ''}
      ${website ? `<div class="marker-popup-website" style="margin-bottom:4px;"><a href="${website}" target="_blank" rel="noopener" style="color:#1976d2;text-decoration:underline;">${website}</a></div>` : ''}
      ${info ? `<div class="marker-popup-info" style="font-size:0.95em;color:#444;">${info}</div>` : ''}
    </div>
  `;
}

export function createMarkerIcon({
  glyph,
  glyphColor = 'white',
  bgColor = 'white',
  glyphSize = '8px',
  iconUrl = `${import.meta.env.BASE_URL}assets/icons/glyph-marker-icon-blue.svg`,
  className,
  iconSize,
  prefix,
  glyphAnchor,
  isActive,
}) {
  // Ensure glyphSize is a string ending with 'px'
  let safeGlyphSize = glyphSize;
  if (typeof safeGlyphSize === 'number') {
    safeGlyphSize = `${safeGlyphSize}px`;
  } else if (typeof safeGlyphSize === 'string' && !safeGlyphSize.endsWith('px')) {
    // If it's a string but missing px, add it
    safeGlyphSize = `${safeGlyphSize}px`;
  } else if (!safeGlyphSize) {
    safeGlyphSize = '8px';
  }
  // Calculate proportional shadow size based on iconSize
  const size = iconSize || [25, 41];
  // Default Leaflet marker is 25x41 icon, 41x41 shadow
  // So shadow width/height = icon width/height * (41/25) and (41/41)
  const shadowWidth = Math.round(size[0] * (41 / 25));
  const shadowHeight = Math.round(size[1] * (41 / 41));
  // Leaflet default: [12, 41] for [41, 41] shadow, so anchorX = 12/41 ≈ 0.29
  const shadowAnchorX = Math.round((shadowWidth * 12) / 41);
  const shadowAnchorY = shadowHeight;

  const base = getBaseUrl();

  return L.icon.glyph({
    iconUrl: iconUrl || `${base}assets/icons/glyph-marker-icon-blue.svg`,
    iconSize: size,
    iconAnchor: [Math.round(size[0] / 2), size[1]],
    popupAnchor: [1, -34],
    tooltipAnchor: [0, 0],
    shadowUrl: `${base}assets/icons/marker-shadow.png`,
    shadowSize: [shadowWidth, shadowHeight],
    shadowAnchor: [shadowAnchorX, shadowAnchorY],
    prefix: prefix || '', // Material Design Icons
    glyph: glyph || '',
    glyphColor: glyphColor || 'white',
    bgColor,
    glyphSize: safeGlyphSize,
    glyphAnchor: glyphAnchor || [0, 0],
    className: isActive ? `${className} marker-active` : className || '',
  });
}

export function createBoothMarkerIcon(number) {
  return createMarkerIcon({ className: `booth-marker booth-number-${number}` });
}

export function createSpecialMarkerIcon() {
  return createMarkerIcon({ className: 'special-marker' });
}
