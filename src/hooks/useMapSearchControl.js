import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { MAP_CONFIG } from '../config/mapConfig';
import { createSearchText } from '../utils/mapHelpers';

/**
 * Custom hook to manage Leaflet search control
 * @param {Object} mapInstance - Leaflet map instance
 * @param {Array} markers - Array of marker objects
 * @returns {Object} Search control reference
 */
export function useMapSearchControl(mapInstance, markers) {
  const searchControlRef = useRef(null);
  const [searchLayer, setSearchLayer] = useState(null);

  // Create search layer with invisible markers for searching
  useEffect(() => {
    if (!mapInstance) return;

    const layerGroup = L.layerGroup();

    markers.forEach((marker) => {
      if (marker.lat && marker.lng) {
        const searchText = createSearchText(marker);
        const leafletMarker = L.marker([marker.lat, marker.lng], {
          opacity: 0,
          interactive: false,
        });
        leafletMarker.feature = { type: 'Feature', properties: { searchText } };
        leafletMarker.bindPopup(marker.name || marker.label || '');
        layerGroup.addLayer(leafletMarker);
      }
    });

    setSearchLayer(layerGroup);
  }, [mapInstance, markers]);

  // Setup search control once layer is ready
  useEffect(() => {
    if (!mapInstance || !searchLayer) return;

    const searchControl = new L.Control.Search({
      layer: searchLayer,
      propertyName: 'searchText',
      initial: false,
      zoom: MAP_CONFIG.SEARCH_ZOOM,
      marker: {
        icon: false,
        animate: true,
      },
      textPlaceholder: 'Search for name or booth...',
      position: 'topleft',
    });

    mapInstance.addControl(searchControl);
    searchControlRef.current = searchControl;

    // Handle search result selection
    searchControl.on('search:locationfound', (e) => {
      if (e?.layer?.getLatLng) {
        const latlng = e.layer.getLatLng();
        mapInstance.flyTo(latlng, MAP_CONFIG.SEARCH_ZOOM, { animate: true });

        // Auto-close search box
        if (searchControl._input) searchControl._input.blur();
        if (searchControl.hideAlert) searchControl.hideAlert();
        if (searchControl.collapse) searchControl.collapse();
      }
    });

    return () => {
      if (mapInstance && searchControl) {
        mapInstance.removeControl(searchControl);
        searchControlRef.current = null;
      }
    };
  }, [mapInstance, searchLayer]);

  return searchControlRef;
}
