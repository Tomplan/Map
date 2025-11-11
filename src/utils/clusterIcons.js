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

    // Use the organization logo as the glyph
    return createMarkerIcon({
      iconUrl: `${import.meta.env.BASE_URL}assets/icons/glyph-marker-icon-orange.svg`,
      iconSize: [50, 82],
      iconAnchor: [25, 41],
      glyph: `<div style='display:flex;align-items:center;justify-content:center;width:100%;height:100%;'>
  <img src='${logoPath}' alt='logo' style='width:40px;height:40px;object-fit:contain;display:block;margin:auto;position:relative;left:1px;top:10px;' />
      </div>`,
      glyphColor: 'white',
      glyphSize: '40px',
      className: 'custom-cluster-icon',
    });
  };
}
