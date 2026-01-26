import { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import { MAP_CONFIG } from '../config/mapConfig';
import { createSearchText } from '../utils/mapHelpers';

/**
 * Custom hook to manage Leaflet search control
 * @param {Object} mapInstance - Leaflet map instance
 * @param {Array|L.LayerGroup} markersOrLayer - Array of marker objects OR a Leaflet LayerGroup
 * @returns {Object} Search control reference
 */
export function useMapSearchControl(mapInstance, markersOrLayer, options = {}) {
  const searchControlRef = useRef(null);
  const [searchLayer, setSearchLayer] = useState(null);
  const optionsString = useMemo(() => JSON.stringify(options), [options]);

  // Create (or accept) search layer with invisible markers for searching.
  // markersOrLayer may be a Leaflet LayerGroup (then we reuse it), or an array
  // of marker objects (then we create and populate a LayerGroup).
  useEffect(() => {
    if (!mapInstance) return;

    // If caller passed a LayerGroup or similar object with addLayer, use it
    if (markersOrLayer && typeof markersOrLayer.addLayer === 'function') {
      setSearchLayer(markersOrLayer);
      return;
    }

    const layerGroup = L.layerGroup();
    const markers = Array.isArray(markersOrLayer) ? markersOrLayer : [];

    markers.forEach((marker) => {
      if (marker && marker.lat && marker.lng) {
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
  }, [mapInstance, markersOrLayer]);

  // Setup search control once layer is ready. Accept caller options and
  // merge with sensible defaults so components can centralize config.
  useEffect(() => {
    if (!mapInstance || !searchLayer) return;

    const defaultOptions = {
      layer: searchLayer,
      propertyName: 'searchText',
      initial: false,
      zoom: MAP_CONFIG.SEARCH_ZOOM,
      marker: {
        icon: false,
        animate: true,
        circle: { radius: 8, color: '#d32f2fff', weight: 2, fillOpacity: 0.15 },
      },
      textPlaceholder: 'Search for name or booth...',
      position: 'topleft',
    };

    const searchConfig = Object.assign({}, defaultOptions, options || {});

    // Deep-merge marker sub-object if provided
    if (options && options.marker) {
      searchConfig.marker = Object.assign({}, defaultOptions.marker, options.marker);
      if (options.marker.circle) {
        searchConfig.marker.circle = Object.assign(
          {},
          defaultOptions.marker.circle,
          options.marker.circle,
        );
      }
    }

    // Ensure the plugin is present before trying to create the control
    let searchControl = null;
    try {
      if (!L.Control || !L.Control.Search) {
        if (process.env.NODE_ENV !== 'production')
          console.warn('[useMapSearchControl] Leaflet Search plugin not present');
        return () => undefined;
      }
      searchControl = new L.Control.Search(searchConfig);
      if (mapInstance && typeof mapInstance.addControl === 'function')
        mapInstance.addControl(searchControl);
    } catch (err) {
      if (process.env.NODE_ENV !== 'production')
        console.warn('[useMapSearchControl] Failed to create search control', err);
      searchControl = null;
    }
    searchControlRef.current = searchControl;

    // Forward locationfound events to the map (same behavior as before)
    searchControl.on('search:locationfound', (e) => {
      if (e?.layer?.getLatLng) {
        const latlng = e.layer.getLatLng();
        mapInstance.flyTo(latlng, searchConfig.zoom, { animate: true });

        // After the map finishes moving / zooming remove the temporary
        // search highlight (the plugin's marker/circle). The plugin stores
        // the transient highlight in different internal properties depending
        // on version/option names. Try to remove the commonly used ones.
        const removeHighlight = () => {
          try {
            // L.Control.Search uses _markerSearch (and older variants may
            // use _marker) to hold the transient marker/circle.
            if (searchControl._markerSearch) {
              if (mapInstance.hasLayer && mapInstance.hasLayer(searchControl._markerSearch)) {
                mapInstance.removeLayer(searchControl._markerSearch);
              } else if (typeof searchControl._markerSearch.remove === 'function') {
                searchControl._markerSearch.remove();
              }
            } else if (searchControl._marker) {
              if (mapInstance.hasLayer && mapInstance.hasLayer(searchControl._marker)) {
                mapInstance.removeLayer(searchControl._marker);
              } else if (typeof searchControl._marker.remove === 'function') {
                searchControl._marker.remove();
              }
            }
          } catch (err) {
            // best-effort cleanup; don't blow up if internals are different
          }
        };

        // Keep the plugin's highlight visible after the search flyTo completes
        // (so the user sees the marker circle). Only remove the highlight when
        // the user manually starts another zoom action — that was your
        // requested behaviour.
        const zoomStartHandler = () => removeHighlight();
        mapInstance.on && mapInstance.on('zoomstart', zoomStartHandler);

        if (searchControl._input) searchControl._input.blur();
        if (searchControl.hideAlert) searchControl.hideAlert();
        if (searchControl.collapse) searchControl.collapse();
      }
    });

    return () => {
      try {
        if (mapInstance && typeof mapInstance.off === 'function') {
          mapInstance.off('zoomstart', zoomStartHandler);
        }
      } catch (err) {
        // ignore
      }

      if (mapInstance && searchControl) {
        mapInstance.removeControl(searchControl);
        searchControlRef.current = null;
      }
    };
  }, [mapInstance, searchLayer, optionsString, options]);

  return searchControlRef;
}
