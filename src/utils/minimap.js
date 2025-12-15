import L from 'leaflet';

/**
 * Initialize a MiniMap control on the given Leaflet map instance.
 * Returns the created control (or null on failure).
 */
export function initMiniMap(mapInstance, mapLayers, mapConfig) {
  if (!mapInstance || !mapLayers || !mapLayers[0]) return null;

  const miniLayer = L.tileLayer(mapLayers[0].url);
  let miniControl = null;

  try {
    if (L.Control && L.Control.MiniMap) {
      miniControl = new L.Control.MiniMap(miniLayer, {
        width: mapConfig.MINIMAP.WIDTH,
        height: mapConfig.MINIMAP.HEIGHT,
        zoomLevelOffset: mapConfig.MINIMAP.ZOOM_LEVEL - mapConfig.DEFAULT_ZOOM,
        toggleDisplay: false,
        aimingRectOptions: { color: mapConfig.MINIMAP.AIMING_COLOR, weight: 1 },
      });
      if (typeof mapInstance.addControl === 'function') mapInstance.addControl(miniControl);
    }
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.warn('[initMiniMap] MiniMap init failed', err);
    miniControl = null;
  }

  return miniControl;
}

export default initMiniMap;
