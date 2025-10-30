import { getLogoPath } from './getLogoPath';
import L from 'leaflet';
import '../libs/Leaflet.Icon.Glyph.js';
import orangeIconUrl from '../../assets/icons/glyph-marker-icon-blue.svg';

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

export function createMarkerIcon({ glyph, glyphColor = 'white', bgColor = 'white', glyphSize = '11px', iconUrl = '/assets/icons/glyph-marker-icon-blue.svg', className, iconSize, prefix }) {
  return L.icon.glyph({
    iconUrl: iconUrl,
    iconSize: iconSize || [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    tooltipAnchor: [0, 0],
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    shadowSize: [41, 41],
    shadowAnchor: [12, 41],
    prefix: prefix || '', // Material Design Icons
    glyph: glyph || '',
    glyphColor: glyphColor || 'white',
    bgColor,
    glyphSize: glyphSize || [35, 35],
    className
  });
}

export function createBoothMarkerIcon(number) {
  return createMarkerIcon({ className: `booth-marker booth-number-${number}` });
}

export function createSpecialMarkerIcon() {
  return createMarkerIcon({ className: 'special-marker' });
}
