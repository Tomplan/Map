// Map control utilities for EventMap

/**
 * Zooms the map in by one step
 * @param {object} mapInstance - Leaflet map instance
 */
export function handleZoomIn(mapInstance) {
  if (mapInstance) mapInstance.zoomIn();
}

/**
 * Zooms the map out by one step
 * @param {object} mapInstance - Leaflet map instance
 */
export function handleZoomOut(mapInstance) {
  if (mapInstance) mapInstance.zoomOut();
}

/**
 * Resets the map view to the given center and zoom
 * @param {object} mapInstance - Leaflet map instance
 * @param {Array} mapCenter - [lat, lng]
 * @param {number} mapZoom - zoom level
 */
export function handleHome(mapInstance, mapCenter, mapZoom) {
  if (mapInstance) mapInstance.setView(mapCenter, mapZoom);
}

/**
 * Expands and focuses the custom search control
 * @param {object} searchControlRef - React ref to Leaflet Search control
 */
export function handleCustomSearchClick(searchControlRef) {
  if (searchControlRef.current && typeof searchControlRef.current.expand === 'function') {
    searchControlRef.current.expand();
    setTimeout(() => {
      const searchInput = document.querySelector('.leaflet-control-search .search-input');
      if (searchInput) searchInput.focus();
    }, 50);
  } else {
    console.warn('Leaflet Search control instance not available.');
  }
}
