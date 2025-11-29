// src/utils/clusterIcons.js
// Utility for custom Leaflet marker cluster icons
import { createMarkerIcon } from './markerIcons';
import { getDefaultLogoPath } from './getDefaultLogo';

/**
 * Creates a custom iconCreateFunction for marker clusters.
 * @param {string} organizationLogo - The organization logo filename from context
 * @returns {function} Custom iconCreateFunction for clusters
 */
export function createIconCreateFunction(organizationLogo) {
  return function iconCreateFunction(cluster) {
    const logoPath = getDefaultLogoPath(organizationLogo);

    // Normalize base URL to always have trailing slash
    const base = import.meta.env.BASE_URL.endsWith('/')
      ? import.meta.env.BASE_URL
      : `${import.meta.env.BASE_URL}/`;

    // Use the organization logo as the glyph
    return createMarkerIcon({
      iconUrl: `${base}assets/icons/glyph-marker-icon-orange.svg`,
      iconSize: [25, 41],
      iconAnchor: [25, 41],
      glyph: `<div style='display:flex;align-items:center;justify-content:center;width:100%;height:100%;'>
  <img src='${logoPath}' alt='logo' style='width:20px;height:20px;object-fit:contain;display:block;margin:auto;position:relative;left:1px;top:10px;' />
      </div>`,
      glyphColor: 'white',
      glyphSize: '20px',
      glyphAnchor: [-1, -7],
      className: 'custom-cluster-icon',
    });
  };
}
