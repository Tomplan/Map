import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { MdAdd, MdRemove, MdHome } from 'react-icons/md';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, CircleMarker, useMap } from 'react-leaflet';
import { getLogoPath } from '../utils/getLogoPath';
import L, { icon } from 'leaflet';
import 'leaflet-search/dist/leaflet-search.src.css';
import 'leaflet-search';
import '../assets/leaflet-search-custom.css';
import { createMarkerIcon } from '../utils/markerIcons';
// Marker state is now provided via props from App.jsx
import useAnalytics from '../hooks/useAnalytics';
import 'leaflet/dist/leaflet.css';

// Fallback to public path if import fails

// Generalized helper to create marker icons

// Utility to extract marker label
function getMarkerLabel(label) {
  if (typeof label === 'string') return label;
  if (label && label.toString) return label.toString();
  return JSON.stringify(label);
}


const MAP_LAYERS = [
  {
    key: 'carto',
    name: 'Carto Voyager',
    attribution: '&copy; <a href="https://carto.com/attributions">Carto</a>',
    url: 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/rastertiles/voyager_nolabels/{z}/{x}/{y}.png',
  },
  {
    key: 'esri',
    name: 'Esri World Imagery',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  },
];

function EventMap({ isAdminView, markersState, updateMarker })  {
  // Helper: get marker angle (default 0)
  function getMarkerAngle(marker) {
    // TODO: Replace with marker.appearanceTab.Angle or similar
    return marker.angle || 0;
  }

  // Helper: rotate a point (meters offset) around origin by angle (degrees)
  function rotatePoint(x, y, angleDeg) {
    const theta = (angleDeg * Math.PI) / 180;
    const xr = x * Math.cos(theta) - y * Math.sin(theta);
    const yr = x * Math.sin(theta) + y * Math.cos(theta);
    return [xr, yr];
  }

  // Custom search button handler
  // Store the Leaflet Search control instance
  const searchControlRef = React.useRef(null);
  const handleCustomSearchClick = () => {
    if (searchControlRef.current && typeof searchControlRef.current.expand === 'function') {
      searchControlRef.current.expand();
      // Focus the input after expanding
      setTimeout(() => {
        const searchInput = document.querySelector('.leaflet-control-search .search-input');
        if (searchInput) searchInput.focus();
      }, 50);
    } else {
      console.warn('Leaflet Search control instance not available.');
    }
  };
  const { t } = useTranslation();
  // Always use Carto Voyager for user view
  const activeLayer = MAP_LAYERS[0].key;
  const [mapInstance, setMapInstance] = useState(null);
  const [markerLayer, setMarkerLayer] = useState(null);
  const DEFAULT_POSITION = [51.898945656392904, 5.779029262641933];
  const DEFAULT_ZOOM = 17; // Default zoom level
  const { trackMarkerView } = useAnalytics();
  // Ensure markers is always an array, memoized for hook compliance
  const safeMarkers = React.useMemo(() => Array.isArray(markersState) ? markersState : [], [markersState]);
  // Rectangle size from appearanceTab (default [6, 6])
  // TODO: Replace with actual appearanceTab.Rectangle prop/state when available
  const rectangleSize = [6, 6]; // meters, [width, height]

  // Helper functions for meters to lat/lng
  function metersToLat(m) {
    return m / 111320;
  }
  function metersToLng(m, lat) {
    return m / (40075000 * Math.cos((lat * Math.PI) / 180) / 360);
  }

  // Rectangle layer ref (do not use state)
  const rectangleLayerRef = React.useRef(null);

  // Create LayerGroup for rectangles when map is ready and markers change
  useEffect(() => {
    if (!mapInstance) return;
    // Remove previous rectangle layer if exists
    if (rectangleLayerRef.current) {
      mapInstance.removeLayer(rectangleLayerRef.current);
    }
    const layerGroup = L.layerGroup();
    safeMarkers.forEach(marker => {
      if (marker.lat && marker.lng) {
        const center = L.latLng(marker.lat, marker.lng);
        const halfWidth = rectangleSize[0] / 2;
        const halfHeight = rectangleSize[1] / 2;
        const angle = getMarkerAngle(marker);
        const markerBlue = marker.iconColor || '#1976d2';
        // Rectangle corners (meters offset from center)
        const corners = [
          rotatePoint(-halfWidth, -halfHeight, angle), // bottom-left
          rotatePoint(halfWidth, -halfHeight, angle),  // bottom-right
          rotatePoint(halfWidth, halfHeight, angle),   // top-right
          rotatePoint(-halfWidth, halfHeight, angle)   // top-left
        ];
        // Convert corners to lat/lng
        const latlngs = corners.map(([x, y]) =>
          L.latLng(
            center.lat + metersToLat(y),
            center.lng + metersToLng(x, center.lat)
          )
        );
        // Draw rotated rectangle as polygon
        const rectangle = L.polygon(latlngs, { color: markerBlue, weight: 1 });
        layerGroup.addLayer(rectangle);
        // Add draggable rotation handle (small blue marker) at top-right corner
        const [handleX, handleY] = corners[2]; // top-right
        const handleLatLng = L.latLng(
          center.lat + metersToLat(handleY),
          center.lng + metersToLng(handleX, center.lat)
        );
        let handleMarker;
        if (isAdminView && !(marker.appearanceLocked)) {
          // Use a small blue icon for the handle
          const handleIcon = L.divIcon({
            className: 'rotation-handle-icon',
            html: '<div style="width:12px;height:12px;background:#1976d2;border-radius:50%;border:2px solid #fff;"></div>',
            iconSize: [12, 12],
            iconAnchor: [6, 6],
          });
          handleMarker = L.marker(handleLatLng, {
            icon: handleIcon,
            draggable: true,
            interactive: true,
            keyboard: true,
            title: 'Drag to rotate',
          });
          handleMarker.on('dragstart', function() {
            if (mapInstance) mapInstance.dragging.disable();
          });
          handleMarker.on('drag', function(e) {
            const newPos = e.target.getLatLng();
            // Calculate angle between center and new handle position
            const dx = metersToLngInv(newPos.lng - center.lng, center.lat);
            const dy = metersToLatInv(newPos.lat - center.lat);
            // Angle in degrees
            const angleRad = Math.atan2(dy, dx);
            let angleDeg = angleRad * 180 / Math.PI;
            if (angleDeg < 0) angleDeg += 360;
            updateMarker(marker.id, { angle: angleDeg });
          });
          handleMarker.on('dragend', function() {
            if (mapInstance) mapInstance.dragging.enable();
          });
        } else {
          // Non-draggable handle for locked state
          const handleIcon = L.divIcon({
            className: 'rotation-handle-icon',
            html: '<div style="width:12px;height:12px;background:#1976d2;border-radius:50%;border:2px solid #fff;opacity:0.5;"></div>',
            iconSize: [12, 12],
            iconAnchor: [6, 6],
          });
          handleMarker = L.marker(handleLatLng, {
            icon: handleIcon,
            draggable: false,
            interactive: false,
            keyboard: false,
            title: 'Locked',
          });
        }
        layerGroup.addLayer(handleMarker);
  // Helper: inverse meters to lat/lng (for drag calculation)
  function metersToLatInv(deltaLat) {
    return deltaLat * 111320;
  }
  function metersToLngInv(deltaLng, lat) {
    return deltaLng * (40075000 * Math.cos((lat * Math.PI) / 180) / 360);
  }
      }
    });
    layerGroup.addTo(mapInstance);
    rectangleLayerRef.current = layerGroup;
    // Cleanup function to remove the layer when dependencies change
    return () => {
      if (mapInstance && rectangleLayerRef.current) {
        mapInstance.removeLayer(rectangleLayerRef.current);
        rectangleLayerRef.current = null;
      }
    };
  }, [mapInstance, markersState, rectangleSize]);

  useEffect(() => {
    // Create LayerGroup for markers when map is ready and markers change
    if (mapInstance) {
      // Remove previous layer if exists
      if (markerLayer) {
        mapInstance.removeLayer(markerLayer);
      }
      const layerGroup = L.layerGroup();
      safeMarkers.forEach(marker => {
        if (marker.lat && marker.lng) {
          const leafletMarker = L.marker([marker.lat, marker.lng], {
            title: marker.name || marker.label || '',
            icon: createMarkerIcon({
              className: marker.type ? `marker-icon marker-type-${marker.type}` : 'marker-icon',
              prefix: marker.prefix,
              iconUrl: marker.iconUrl || `${marker.type || 'default'}.svg`,
              iconSize: marker.iconSize || [25, 41],
              iconColor: marker.iconColor || 'blue',
              glyph: marker.glyph || '',
              glyphColor: marker.glyphColor || 'white',
              glyphSize: marker.glyphSize || '14px',
              glyphAnchor: marker.glyphAnchor || [0,0]
            })
          });
          leafletMarker.bindPopup(getMarkerLabel(marker.label));
          layerGroup.addLayer(leafletMarker);
        }
      });
      layerGroup.addTo(mapInstance);
      setMarkerLayer(layerGroup);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapInstance, markersState]);

  // Add Leaflet Search control when map and markerLayer are ready
  useEffect(() => {
    if (mapInstance && markerLayer) {
      const searchControl = new L.Control.Search({
        layer: markerLayer,
        initial: false,
        zoom: 20,
        marker: {
          icon: false,
          animate: true
        },
        textPlaceholder: 'Search for a booth-holder...',
        position: 'topleft',
      });
      mapInstance.addControl(searchControl);
      searchControlRef.current = searchControl;
      return () => {
        mapInstance.removeControl(searchControl);
        searchControlRef.current = null;
      };
    }
  }, [mapInstance, markerLayer]);

  // Map config for fullscreen
  const mapCenter = DEFAULT_POSITION;
  const mapZoom = DEFAULT_ZOOM;
  const minZoom = 14;
  const maxZoom = 22;
  const handleMapCreated = (mapOrEvent) => {
    // React-Leaflet v5 passes event, v3/v4 passes map
    if (mapOrEvent && mapOrEvent.target) {
      setMapInstance(mapOrEvent.target);
    } else {
      setMapInstance(mapOrEvent);
    }
  };


  // Add zoom and home controls
  const handleZoomIn = () => {
    if (mapInstance) mapInstance.zoomIn();
  };
  const handleZoomOut = () => {
    if (mapInstance) mapInstance.zoomOut();
  };
  const handleHome = () => {
    if (mapInstance) mapInstance.setView(mapCenter, mapZoom);
  };

  return (
    <div
      style={{ height: '100vh', width: '100vw', position: 'fixed', inset: 0, zIndex: 0 }}
      tabIndex={0}
      aria-label="Event Map"
      role="region"
    >
      {/* Layer select button removed for user view */}
      {/* Zoom, home, and custom search controls */}
  <div style={{ position: 'absolute', top: 80, right: 10, zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <button
          onClick={handleZoomIn}
          aria-label="Zoom in"
          className="bg-white rounded-full shadow p-2 mb-2 flex items-center justify-center"
          style={{ width: 44, height: 44 }}
        >
          <MdAdd size={28} color="#1976d2" aria-hidden="true" />
          <span className="sr-only">Zoom in</span>
        </button>
        <button
          onClick={handleZoomOut}
          aria-label="Zoom out"
          className="bg-white rounded-full shadow p-2 mb-2 flex items-center justify-center"
          style={{ width: 44, height: 44 }}
        >
          <MdRemove size={28} color="#1976d2" aria-hidden="true" />
          <span className="sr-only">Zoom out</span>
        </button>
        <button
          onClick={handleHome}
          aria-label="Home"
          className="bg-white rounded-full shadow p-2 flex items-center justify-center"
          style={{ width: 44, height: 44 }}
        >
          <MdHome size={28} color="#1976d2" aria-hidden="true" />
          <span className="sr-only">Home</span>
        </button>
      </div>
      {/* Map container */}
      <div
        id="map-container"
        className="fixed inset-0 w-full h-full"
        style={{ zIndex: 1 }}
        aria-label={t('map.ariaLabel')}
      >
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          minZoom={minZoom}
          maxZoom={maxZoom}
          zoomDelta={0.5}
          zoomSnap={0.5}
          zoomControl={false}
          style={{ width: '100vw', height: '100vh' }}
          className="focus:outline-none focus:ring-2 focus:ring-primary"
          whenReady={handleMapCreated}
          attributionControl={false}
        >
          {MAP_LAYERS.filter(layer => layer.key === activeLayer).map(layer => (
            <TileLayer
              key={layer.key}
              attribution={layer.attribution}
              url={layer.url}
              maxZoom={22}
            />
          ))}

          {safeMarkers.map(marker => {
            let pos = [marker.lat, marker.lng];
            let iconFile = marker.iconUrl;
            if (!iconFile) {
              iconFile = `${marker.type || 'default'}.svg`;
            }
            // Ensure path always starts with assets/icons/
            if (!iconFile.startsWith('assets/icons/')) {
              iconFile = `assets/icons/${iconFile}`;
            }
            const icon = createMarkerIcon({
              className: marker.type ? `marker-icon marker-type-${marker.type}` : 'marker-icon',
              prefix: marker.prefix,
              iconUrl: iconFile,
              iconSize: marker.iconSize || [25, 41],
              iconColor: marker.iconColor || 'blue',
              glyph: marker.glyph || '',
              glyphColor: marker.glyphColor || 'white',
              glyphSize: marker.glyphSize || '14px',
              glyphAnchor: marker.glyphAnchor || [0,0]
            });
            // Tooltip content: logo and name
            const logoPath = marker.logo ? getLogoPath(marker.logo) : null;
            const tooltipContent = (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: 0,
                  padding: 0,
                  whiteSpace: 'nowrap',
                  minWidth: 'max-content',
                }}
              >
                {logoPath && (
                  <img
                    src={logoPath}
                    alt={marker.name || 'Logo'}
                    style={{ width: 32, height: 32, objectFit: 'contain', marginRight: 4 }}
                  />
                )}
                <span style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{marker.name}</span>
              </div>
            );
            const labelText = getMarkerLabel(marker.label);
            const isDraggable = isAdminView && !marker.locked;
            return (
              <Marker
                key={marker.id}
                position={pos}
                icon={icon}
                draggable={isDraggable}
                eventHandlers={isDraggable ? {
                  dragend: (e) => {
                    const { lat, lng } = e.target.getLatLng();
                    updateMarker(marker.id, { lat, lng });
                  }
                } : {}}
              >
                <Popup onOpen={() => trackMarkerView(marker.id)}>{labelText}</Popup>
                <Tooltip direction="top" offset={[0, -32]} opacity={1} permanent={false}>
                  {tooltipContent}
                </Tooltip>
              </Marker>
            );
          })}
          
        </MapContainer>
      </div>
    </div>
  );
}

export default EventMap;

