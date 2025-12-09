import L from 'leaflet';

function extractIconUrlFromDomIcon(domIcon) {
  try {
    if (!domIcon || !domIcon.style) return null;
    const bg = domIcon.style.backgroundImage || '';
    const m = bg.match(/url\(["']?(.*?)["']?\)/);
    if (m && m[1]) return m[1];

    // If DOM contains an <img> tag, try to find it
    const img = domIcon.querySelector && domIcon.querySelector('img');
    if (img && img.src) return img.src;
  } catch (e) {
    // ignore
  }
  return null;
}

export function cloneMarkerLayer(layer) {
  // Defensive extraction of icon options from layer
  const iconOpts = layer?.options?.icon?.options;

  // If iconOpts isn't present, try to extract from DOM node (DIV-based glyph icons)
  let finalIconUrl = iconOpts?.iconUrl;
  if (!finalIconUrl && layer && layer._icon) {
    const domUrl = extractIconUrlFromDomIcon(layer._icon);
    if (domUrl) finalIconUrl = domUrl;
  }

  // Build cloned icon with fallback strategies
  let clonedIcon;
  const isGlyphIcon = iconOpts && (iconOpts.glyph !== undefined || iconOpts.prefix);

  if (isGlyphIcon && L.icon && L.icon.glyph) {
    // Prefer glyph icon when available
    clonedIcon = L.icon.glyph({
      iconUrl: finalIconUrl || iconOpts?.iconUrl,
      iconSize: iconOpts?.iconSize || [25, 41],
      iconAnchor: iconOpts?.iconAnchor || [12, 41],
      popupAnchor: iconOpts?.popupAnchor || [1, -34],
      shadowUrl: iconOpts?.shadowUrl,
      shadowSize: iconOpts?.shadowSize,
      shadowAnchor: iconOpts?.shadowAnchor,
      prefix: iconOpts?.prefix || '',
      glyph: iconOpts?.glyph || '',
      glyphColor: iconOpts?.glyphColor || 'white',
      bgColor: iconOpts?.bgColor,
      glyphSize: iconOpts?.glyphSize || '11px',
      glyphAnchor: iconOpts?.glyphAnchor || [0, 0],
      className: iconOpts?.className || '',
    });
  } else if (finalIconUrl) {
    // Regular image icon fallback
    clonedIcon = L.icon({
      iconUrl: finalIconUrl,
      iconSize: iconOpts?.iconSize,
      iconAnchor: iconOpts?.iconAnchor,
      popupAnchor: iconOpts?.popupAnchor,
      shadowUrl: iconOpts?.shadowUrl,
      shadowSize: iconOpts?.shadowSize,
      shadowAnchor: iconOpts?.shadowAnchor,
      className: iconOpts?.className || '',
    });
  } else if (iconOpts) {
    // Icon options present but no url (best-effort regular icon)
    clonedIcon = L.icon({
      iconUrl: iconOpts?.iconUrl,
      iconSize: iconOpts?.iconSize,
      iconAnchor: iconOpts?.iconAnchor,
      popupAnchor: iconOpts?.popupAnchor,
      shadowUrl: iconOpts?.shadowUrl,
      shadowSize: iconOpts?.shadowSize,
      shadowAnchor: iconOpts?.shadowAnchor,
      className: iconOpts?.className || '',
    });
  } else {
    // Last-resort use default Leaflet icon
    clonedIcon = new L.Icon.Default();
  }

  // Create new marker using clonedIcon and preserve basic options
  const marker = L.marker(layer.getLatLng(), {
    ...layer.options,
    icon: clonedIcon,
  });

  // Copy popup content if present
  if (layer.getPopup && layer.getPopup()) {
    marker.bindPopup(layer.getPopup().getContent());
  }

  return marker;
}

export function cloneMarkerClusterLayer(clusterGroup) {
  const markers = [];
  const group = clusterGroup._group || clusterGroup;

  try {
    group.eachLayer((marker) => {
      if (marker instanceof L.Marker) {
        markers.push(cloneMarkerLayer(marker));
      }
    });
  } catch (e) {
    // if iteration fails, return an empty cluster to avoid breaking print
  }

  const clusterOptions = group.options || {};
  let cluster;
  if (typeof L.markerClusterGroup === 'function') {
    cluster = L.markerClusterGroup(clusterOptions);
  } else {
    // marker cluster plugin not present in test environment — fall back to a layerGroup
    cluster = L.layerGroup();
  }
  if (typeof cluster.addLayers === 'function') {
    cluster.addLayers(markers);
  } else {
    markers.forEach((m) => cluster.addLayer(m));
  }
  return cluster;
}

export default { cloneMarkerLayer, cloneMarkerClusterLayer };
