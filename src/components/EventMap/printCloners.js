import L from 'leaflet';
import { getAbsoluteUrl } from '../../utils/getBaseUrl';

/**
 * Print cloner module for Leaflet BrowserPrint plugin.
 *
 * Uses L.icon.glyph() recreation as the primary strategy since all markers
 * in this application are created via createMarkerIcon() which stores complete
 * icon options. This ensures print output matches UI exactly with:
 * - Correct icon positioning (iconAnchor preserved)
 * - Proper glyph text/numbers
 * - Accurate icon sizes
 * - Shadow rendering
 *
 * Fallback chain: L.icon.glyph() → L.icon() → L.Icon.Default()
 */

/**
 * Convert a URL to absolute format for print iframe compatibility.
 * Print overlays created by BrowserPrint plugin use a separate iframe context
 * where relative URLs may not resolve correctly.
 * @param {string} url - URL to convert (can be relative, absolute, or data URI)
 * @returns {string} Absolute URL or original if already absolute/data
 */
function makeAbsoluteUrl(url) {
  return getAbsoluteUrl(url);
}

/**
 * Clone a single marker layer for print output.
 * Recreates the icon using L.icon.glyph() with all original options preserved.
 * Skips invisible or non-interactive markers (e.g., search layer markers).
 *
 * @param {L.Marker} layer - Original marker layer to clone
 * @returns {L.Marker|null} Cloned marker with properly configured icon, or null if marker should be skipped
 */
export function cloneMarkerLayer(layer) {
  // Skip invisible markers (e.g., search layer markers with opacity: 0)
  // These are used for search functionality but shouldn't appear in print
  if (layer?.options?.opacity === 0 || layer?.options?.interactive === false) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[PrintCloner] ⏭ Skipping invisible/non-interactive marker');
    }
    return null;
  }

  const iconOpts = layer?.options?.icon?.options;
  const latLng = layer.getLatLng();

  let clonedIcon;

  // Strategy 1: Recreate glyph icon (primary - all our markers use this)
  const isGlyphIcon = iconOpts && (iconOpts.glyph !== undefined || iconOpts.prefix !== undefined);

  if (isGlyphIcon && L.icon && L.icon.glyph) {
    const opts = {
      iconUrl: makeAbsoluteUrl(iconOpts.iconUrl),
      // Use iconSize as originally cloned (UI-scaled) to preserve previous behavior
      iconSize: iconOpts.iconSize || [25, 41],
      iconAnchor: iconOpts.iconAnchor || [12, 41],
      popupAnchor: iconOpts.popupAnchor || [1, -34],
      shadowUrl: makeAbsoluteUrl(iconOpts.shadowUrl),
      shadowSize: iconOpts.shadowSize,
      shadowAnchor: iconOpts.shadowAnchor,
      prefix: iconOpts.prefix || '',
      glyph: iconOpts.glyph || '',
      glyphColor: iconOpts.glyphColor || 'white',
      bgColor: iconOpts.bgColor,
      glyphSize: iconOpts.glyphSize || '11px',
      glyphAnchor: iconOpts.glyphAnchor || [0, 0],
      className: iconOpts.className || '',
      // Preserve baseIconSize as created by createMarkerIcon when possible
      baseIconSize: iconOpts.baseIconSize || undefined,
    };

    clonedIcon = L.icon.glyph(opts);

    if (process.env.NODE_ENV !== 'production') {
      console.log('[PrintCloner] ✓ L.icon.glyph()', {
        glyph: opts.glyph,
        iconSize: opts.iconSize,
        iconAnchor: opts.iconAnchor,
      });
    }
  }
  // Strategy 2: Regular image icon fallback
  else if (iconOpts?.iconUrl) {
    clonedIcon = L.icon({
      iconUrl: makeAbsoluteUrl(iconOpts.iconUrl),
      iconSize: iconOpts.iconSize,
      iconAnchor: iconOpts.iconAnchor,
      popupAnchor: iconOpts.popupAnchor,
      shadowUrl: makeAbsoluteUrl(iconOpts.shadowUrl),
      shadowSize: iconOpts.shadowSize,
      shadowAnchor: iconOpts.shadowAnchor,
      className: iconOpts.className || '',
    });

    if (process.env.NODE_ENV !== 'production') {
      console.log('[PrintCloner] ✓ L.icon()', {
        iconUrl: iconOpts.iconUrl,
        iconSize: iconOpts.iconSize,
      });
    }
  }
  // Strategy 3: Last resort - Leaflet default icon
  else {
    clonedIcon = new L.Icon.Default();

    if (process.env.NODE_ENV !== 'production') {
      console.log('[PrintCloner] ⚠ L.Icon.Default() fallback');
    }
  }

  // Create new marker with cloned icon
  const marker = L.marker(latLng, {
    ...layer.options,
    icon: clonedIcon,
  });

  // Copy popup content if present
  if (layer.getPopup && layer.getPopup()) {
    marker.bindPopup(layer.getPopup().getContent());
  }

  return marker;
}

/**
 * Clone a marker cluster group for print output.
 * Iterates through all markers in the cluster and clones each one.
 *
 * @param {L.MarkerClusterGroup} clusterGroup - Original cluster group to clone
 * @returns {L.MarkerClusterGroup|L.LayerGroup} Cloned cluster with all markers
 */
export function cloneMarkerClusterLayer(clusterGroup) {
  const markers = [];
  const group = clusterGroup._group || clusterGroup;

  try {
    group.eachLayer((marker) => {
      if (marker instanceof L.Marker) {
        const cloned = cloneMarkerLayer(marker);
        // Only add non-null markers (invisible markers return null)
        if (cloned) {
          markers.push(cloned);
        }
      }
    });
  } catch (e) {
    // If iteration fails, return an empty cluster to avoid breaking print
    console.warn('[PrintCloner] Failed to iterate cluster markers:', e);
  }

  const clusterOptions = group.options || {};
  let cluster;

  if (typeof L.markerClusterGroup === 'function') {
    cluster = L.markerClusterGroup(clusterOptions);
  } else {
    // Marker cluster plugin not present - fall back to layerGroup
    cluster = L.layerGroup();
  }

  if (typeof cluster.addLayers === 'function') {
    cluster.addLayers(markers);
  } else {
    markers.forEach((m) => cluster.addLayer(m));
  }

  if (process.env.NODE_ENV !== 'production') {
    console.log('[PrintCloner] ✓ Cloned cluster with', markers.length, 'markers');
  }

  return cluster;
}

export default { cloneMarkerLayer, cloneMarkerClusterLayer };
