// src/utils/clusterIcons.js
// Utility for custom Leaflet marker cluster icons
import L from 'leaflet';
import { createMarkerIcon } from './markerIcons';

/**
 * Custom iconCreateFunction for marker clusters.
 * @param {L.MarkerCluster} cluster - The cluster object.
 * @returns {L.DivIcon} Custom cluster icon.
 */
export function iconCreateFunction(cluster) {
  const count = cluster.getChildCount();
  // Use the 4x4Vakantiebeurs.png logo as the glyph
    return createMarkerIcon({
  iconUrl: '/assets/icons/glyph-marker-icon-orange.svg',
      iconSize: [50, 82],
      iconAnchor: [25, 41],
      glyph: `<div style='display:flex;align-items:center;justify-content:center;width:100%;height:100%;'>
  <img src='/assets/logos/4x4Vakantiebeurs.png' alt='logo' style='width:40px;height:40px;object-fit:contain;display:block;margin:auto;position:relative;left:1px;top:10px;' />
      </div>`,
      glyphColor: 'white',
      glyphSize: '40px',
      className: 'custom-cluster-icon'
    });
}

