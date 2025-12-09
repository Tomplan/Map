import L from 'leaflet';

function extractDomIconMeta(domIcon) {
  try {
    if (!domIcon || !domIcon.style) return null;

    const meta = {
      iconUrl: null,
      glyph: null,
      glyphColor: null,
      glyphSize: null,
      prefix: null,
      glyphAnchor: null,
      className: domIcon.className || '',
    };

    // Background-image URL (prefer inline style, fall back to computed style)
    let bg = domIcon.style && domIcon.style.backgroundImage ? domIcon.style.backgroundImage : '';
    try {
      if ((!bg || bg === 'none') && typeof window !== 'undefined' && window.getComputedStyle) {
        const cs = window.getComputedStyle(domIcon);
        bg = cs && cs.backgroundImage ? cs.backgroundImage : bg;
      }
    } catch (e) {
      // ignore getComputedStyle errors in non-browser test envs
    }
    const m = bg.match(/url\(["']?(.*?)["']?\)/);
    if (m && m[1]) meta.iconUrl = m[1];

    // If DOM contains an <img> tag, prefer its src
    const img = domIcon.querySelector && domIcon.querySelector('img');
    if (img && img.src) meta.iconUrl = img.src;

    // If DOM contains an inline SVG, serialize it to a data URL so the cloner
    // can recreate the same visual in the print overlay.
    const svg = domIcon.querySelector && domIcon.querySelector('svg');
    if (svg) {
      try {
        const outer = svg.outerHTML || svg.innerHTML;
        if (outer) {
          // Create an encoded data URL for the SVG
          const svgUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(outer)}`;
          meta.iconUrl = svgUrl;
        }
      } catch (e) {
        // ignore svg serialization errors
      }
    }

    // Try to extract glyph span (Leaflet.Icon.Glyph creates a span child)
    const span = domIcon.querySelector && domIcon.querySelector('span');
    if (span) {
      // text content (either icon class or direct content)
      const text = span.innerHTML || span.textContent;
      meta.glyph = text ? (text.trim() || null) : null;

      // inline styles we can reuse:
      const style = span.style || {};
      if (style.color) meta.glyphColor = style.color;
      if (style.fontSize) meta.glyphSize = style.fontSize;

      // Left/top positioning -> glyphAnchor (x, y)
      const left = style.left ? parseFloat(style.left.replace(/[^0-9.-]/g, '')) : null;
      const top = style.top ? parseFloat(style.top.replace(/[^0-9.-]/g, '')) : null;
      if (left !== null || top !== null) {
        meta.glyphAnchor = [Number.isFinite(left) ? left : 0, Number.isFinite(top) ? top : 0];
      }

      // If classes include a prefix (FontAwesome etc), first token is often prefix
      if (span.className) {
        const parts = span.className.trim().split(/\s+/);
        if (parts.length > 0) meta.prefix = parts[0];
      }
    }

    return meta;
  } catch (e) {
    // ignore
  }
  return null;
}

function serializeDomToHtmlWithInlineStyles(domIcon) {
  try {
    if (!domIcon) return '';

    // Clone to avoid mutating original
    const clone = domIcon.cloneNode(true);

    // Walk and inline select computed styles for every element in the subtree
    const queue = [clone];
    while (queue.length) {
      const node = queue.shift();
      // Add children to queue
      if (node.children && node.children.length) {
        for (let i = 0; i < node.children.length; i++) queue.push(node.children[i]);
      }

      try {
        if (typeof window !== 'undefined' && window.getComputedStyle) {
          const cs = window.getComputedStyle(domIcon.nodeType === 1 ? (node.__original || node) : node) || window.getComputedStyle(node);
          // Select properties that affect appearance for marker icons
          const props = [
            'background-image', 'background-size', 'background-position', 'background-repeat', 'background-color',
            'filter', 'transform', 'width', 'height', 'display', 'margin-left', 'margin-top',
            'color', 'font-size', 'line-height', 'left', 'top', 'text-align'
          ];

          const inline = [];
          props.forEach((p) => {
            try {
              const v = cs.getPropertyValue(p);
              if (v && v !== 'initial' && v !== 'none' && v.trim() !== '') {
                inline.push(`${p}:${v};`);
              }
            } catch (e) {
              // ignore per-property failures
            }
          });

          if (inline.length) {
            // merge with existing style attribute if present
            const existing = node.getAttribute && node.getAttribute('style');
            node.setAttribute('style', `${existing || ''}${inline.join('')}`);
          }
        }
      } catch (e) {
        // Ignore computed style issues in testing environments
      }
    }

    // Return serialized HTML of the clone
    return clone.outerHTML;
  } catch (e) {
    return domIcon && domIcon.outerHTML ? domIcon.outerHTML : '';
  }
}

export function cloneMarkerLayer(layer) {
  // Defensive extraction of icon options from layer
  const iconOpts = layer?.options?.icon?.options;

  // If iconOpts isn't present, try to extract from DOM node (DIV-based glyph icons)
  let finalIconUrl = iconOpts?.iconUrl;
  let domMeta = null;
  if (layer && layer._icon) {
    domMeta = extractDomIconMeta(layer._icon);
    // Prefer iconUrl from domMeta
    if (domMeta && domMeta.iconUrl) finalIconUrl = domMeta.iconUrl;
  }

  // Build cloned icon with fallback strategies
  let clonedIcon;
  // If the layer has a DOM icon node, prefer serializing that DOM (with
  // computed styles inlined) so the print overlay visually matches the
  // live map. This avoids relying on possibly stale options.
  if (layer && layer._icon) {
    try {
      const html = serializeDomToHtmlWithInlineStyles(layer._icon);
      // Create a divIcon using the serialized markup (preserve className)
      clonedIcon = L.divIcon({ html, className: layer._icon.className || '' });
    } catch (e) {
      // Fall back to existing logic
      clonedIcon = null;
    }
  }
  const isGlyphIcon = (iconOpts && (iconOpts.glyph !== undefined || iconOpts.prefix)) || (domMeta && domMeta.glyph);

  if (!clonedIcon && isGlyphIcon && L.icon && L.icon.glyph) {
    // Prefer glyph icon when available
    const opts = {
      iconUrl: finalIconUrl || iconOpts?.iconUrl,
      iconSize: iconOpts?.iconSize || [25, 41],
      iconAnchor: iconOpts?.iconAnchor || [12, 41],
      popupAnchor: iconOpts?.popupAnchor || [1, -34],
      shadowUrl: iconOpts?.shadowUrl,
      shadowSize: iconOpts?.shadowSize,
      shadowAnchor: iconOpts?.shadowAnchor,
      prefix: (iconOpts && iconOpts.prefix) || (domMeta && domMeta.prefix) || '',
      glyph: (iconOpts && iconOpts.glyph) || (domMeta && domMeta.glyph) || '',
      glyphColor: (iconOpts && iconOpts.glyphColor) || (domMeta && domMeta.glyphColor) || 'white',
      bgColor: iconOpts?.bgColor,
      glyphSize: (iconOpts && iconOpts.glyphSize) || (domMeta && domMeta.glyphSize) || '11px',
      glyphAnchor: (iconOpts && iconOpts.glyphAnchor) || (domMeta && domMeta.glyphAnchor) || [0, 0],
      className: (iconOpts && iconOpts.className) || (domMeta && domMeta.className) || '',
    };

    clonedIcon = L.icon.glyph(opts);
  } else if (!clonedIcon && finalIconUrl) {
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
  } else if (!clonedIcon && iconOpts) {
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
  } else if (!clonedIcon) {
    // If the original marker used a DOM-based icon, try to replicate the
    // exact markup (with computed styles inlined) using a divIcon so the
    // print overlay visually matches the UI exactly.
    if (layer && layer._icon) {
      try {
        const html = serializeDomToHtmlWithInlineStyles(layer._icon);
        clonedIcon = L.divIcon({ html, className: layer._icon.className || '' });
      } catch (e) {
        clonedIcon = new L.Icon.Default();
      }
    } else {
      // Last-resort default Leaflet icon
      clonedIcon = new L.Icon.Default();
    }
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
