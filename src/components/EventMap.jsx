// Custom checkbox styles for layers popover
const checkboxStyle = {
  appearance: 'none',
  WebkitAppearance: 'none',
  MozAppearance: 'none',
  outline: 'none',
  background: '#fff',
  border: '2px solid #1976d2',
  borderRadius: 4,
  width: 18,
  height: 18,
  display: 'inline-block',
  position: 'relative',
  marginRight: 8,
  cursor: 'pointer',
  verticalAlign: 'middle',
};
import React, { useState, useEffect } from 'react';
import Icon from '@mdi/react';
import { mdiLayersTriple } from '@mdi/js';
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
  // Layer selection state (admin only)
  const [showLayersMenu, setShowLayersMenu] = useState(false);
  const [activeLayer, setActiveLayer] = useState(MAP_LAYERS[0].key);
  const [showRectangles, setShowRectangles] = useState(true);
  const [showHandles, setShowHandles] = useState(true);
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

  // Rectangle/handle LayerGroup (independent from marker LayerGroup)
  const rectangleLayerRef = React.useRef(null);

  // Helper: inverse meters to lat/lng (for drag calculation)
  function metersToLatInv(deltaLat) {
    return deltaLat * 111320;
  }
  function metersToLngInv(deltaLng, lat) {
    return deltaLng * (40075000 * Math.cos((lat * Math.PI) / 180) / 360);
  }

  // Persistent LayerGroup for rectangles/handles
  // Only update rectangles/handles when marker data changes, not on zoom
  useEffect(() => {
    if (!mapInstance) return;
    // Create rectangle/handle LayerGroup if not exists
    if (!rectangleLayerRef.current) {
      rectangleLayerRef.current = L.layerGroup();
      rectangleLayerRef.current.addTo(mapInstance);
    }
    const rectLayerGroup = rectangleLayerRef.current;
    if (!rectLayerGroup._markerLayers) rectLayerGroup._markerLayers = {};
    // Remove layers for markers that no longer exist
    Object.keys(rectLayerGroup._markerLayers).forEach(id => {
      if (!safeMarkers.find(m => m.id === id)) {
        rectLayerGroup.removeLayer(rectLayerGroup._markerLayers[id].rectangle);
        rectLayerGroup.removeLayer(rectLayerGroup._markerLayers[id].handle);
        delete rectLayerGroup._markerLayers[id];
      }
    });
    // Add/update layers for current markers
    safeMarkers.forEach(marker => {
      if (marker.lat && marker.lng) {
        const center = L.latLng(marker.lat, marker.lng);
        const halfWidth = rectangleSize[0] / 2;
        const halfHeight = rectangleSize[1] / 2;
        const angle = getMarkerAngle(marker);
        const markerBlue = marker.iconColor || '#1976d2';
        const corners = [
          rotatePoint(-halfWidth, -halfHeight, angle),
          rotatePoint(halfWidth, -halfHeight, angle),
          rotatePoint(halfWidth, halfHeight, angle),
          rotatePoint(-halfWidth, halfHeight, angle)
        ];
        const latlngs = corners.map(([x, y]) =>
          L.latLng(
            center.lat + metersToLat(y),
            center.lng + metersToLng(x, center.lat)
          )
        );
        let rectangle, handleMarker;
        if (rectLayerGroup._markerLayers[marker.id]) {
          rectangle = rectLayerGroup._markerLayers[marker.id].rectangle;
          rectangle.setLatLngs(latlngs);
          handleMarker = rectLayerGroup._markerLayers[marker.id].handle;
          const [handleX, handleY] = corners[2];
          const handleLatLng = L.latLng(
            center.lat + metersToLat(handleY),
            center.lng + metersToLng(handleX, center.lat)
          );
          handleMarker.setLatLng(handleLatLng);
        } else {
          rectangle = L.polygon(latlngs, { color: markerBlue, weight: 1 });
          const [handleX, handleY] = corners[2];
          const handleLatLng = L.latLng(
            center.lat + metersToLat(handleY),
            center.lng + metersToLng(handleX, center.lat)
          );
          let handleMarker;
          if (isAdminView && !(marker.appearanceLocked)) {
            const handleIcon = L.divIcon({
              className: 'rotation-handle-icon',
              html: '<div style="width:8px;height:8px;background:#1976d2;border-radius:50%;"></div>',
              iconSize: [8, 8],
              iconAnchor: [4, 4],
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
            let lastAngle = angle;
            handleMarker.on('drag', function(e) {
              const newPos = e.target.getLatLng();
              const dx = metersToLngInv(newPos.lng - center.lng, center.lat);
              const dy = metersToLatInv(newPos.lat - center.lat);
              const angleRad = Math.atan2(dy, dx);
              let angleDeg = angleRad * 180 / Math.PI;
              if (angleDeg < 0) angleDeg += 360;
              lastAngle = angleDeg;
              const newCorners = [
                rotatePoint(-halfWidth, -halfHeight, lastAngle),
                rotatePoint(halfWidth, -halfHeight, lastAngle),
                rotatePoint(halfWidth, halfHeight, lastAngle),
                rotatePoint(-halfWidth, halfHeight, lastAngle)
              ];
              const newLatLngs = newCorners.map(([x, y]) =>
                L.latLng(
                  center.lat + metersToLat(y),
                  center.lng + metersToLng(x, center.lat)
                )
              );
              rectangle.setLatLngs(newLatLngs);
              const [newHandleX, newHandleY] = newCorners[2];
              const newHandleLatLng = L.latLng(
                center.lat + metersToLat(newHandleY),
                center.lng + metersToLng(newHandleX, center.lat)
              );
              handleMarker.setLatLng(newHandleLatLng);
            });
            handleMarker.on('dragend', function() {
              if (mapInstance) mapInstance.dragging.enable();
              updateMarker(marker.id, { angle: lastAngle });
            });
          } else {
            const handleIcon = L.divIcon({
              className: 'rotation-handle-icon',
              html: '<div style="width:8px;height:8px;background:#1976d2;border-radius:50%;opacity:0.5;"></div>',
              iconSize: [8, 8],
              iconAnchor: [4, 4],
            });
            handleMarker = L.marker(handleLatLng, {
              icon: handleIcon,
              draggable: false,
              interactive: false,
              keyboard: false,
              title: 'Locked',
            });
          }
          rectLayerGroup.addLayer(rectangle);
          rectLayerGroup.addLayer(handleMarker);
          rectLayerGroup._markerLayers[marker.id] = { rectangle, handle: handleMarker };
        }
      }
    });
    // Show/hide rectangles and handles independently
    Object.values(rectLayerGroup._markerLayers).forEach(({ rectangle, handle }) => {
      if (showRectangles) {
        rectLayerGroup.addLayer(rectangle);
      } else {
        rectLayerGroup.removeLayer(rectangle);
      }
      if (showHandles) {
        rectLayerGroup.addLayer(handle);
      } else {
        rectLayerGroup.removeLayer(handle);
      }
    });
    // Rectangle/handle layers are independent from main marker layers
  }, [mapInstance, markersState, rectangleSize, isAdminView, showRectangles, showHandles]);

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
      {/* Zoom, home, and custom search controls + admin layers popover */}
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
        {/* Admin-only layers button and popover */}
        {isAdminView && (
          <div style={{ position: 'relative' }}>
            <button
              aria-label="Map layers"
              className="bg-white rounded-full shadow p-2 flex items-center justify-center mt-2 hover:bg-gray-100 focus:outline-none"
              style={{ width: 44, height: 44 }}
              onClick={() => setShowLayersMenu(v => !v)}
            >
              <Icon path={mdiLayersTriple} size={1.2} color="#1976d2" />
              <span className="sr-only">Map layers</span>
            </button>
            {showLayersMenu && (
              <div
                className="absolute right-0 mt-2 bg-white rounded shadow-lg border z-50"
                style={{ minWidth: 200, padding: 8, color: '#1976d2' }}
                role="menu"
                aria-label="Layer selection"
              >
                <div className="font-semibold mb-2">Base Layers</div>
                {MAP_LAYERS.map(layer => (
                  <button
                    key={layer.key}
                    className={`w-full text-left px-2 py-1 rounded hover:bg-blue-50 ${activeLayer === layer.key ? 'bg-blue-50 font-bold' : ''}`}
                    onClick={() => setActiveLayer(layer.key)}
                    role="menuitem"
                    style={{ color: '#1976d2' }}
                  >
                    {layer.name}
                  </button>
                ))}
                <div className="font-semibold mt-4 mb-2">Map Features</div>
                <label className="flex items-center px-2 py-1 cursor-pointer hover:bg-blue-50 rounded" style={{ color: '#1976d2' }}>
                  <input
                    type="checkbox"
                    checked={showRectangles}
                    onChange={e => setShowRectangles(e.target.checked)}
                    style={checkboxStyle}
                  />
                  <span style={{
                    position: 'relative',
                    left: -26,
                    width: 18,
                    height: 18,
                    pointerEvents: 'none',
                    display: showRectangles ? 'inline-block' : 'none',
                  }}>
                    {/* SVG checkmark, blue */}
                    <svg width="18" height="18" viewBox="0 0 18 18" style={{ position: 'absolute', top: 0, left: 0 }}>
                      <polyline points="4,9 8,13 14,5" stroke="#1976d2" strokeWidth="2.5" fill="none" />
                    </svg>
                  </span>
                  <span style={{ marginLeft: showRectangles ? -8 : 0 }}>Show rectangles</span>
                </label>
                <label className="flex items-center px-2 py-1 cursor-pointer hover:bg-blue-50 rounded" style={{ color: '#1976d2' }}>
                  <input
                    type="checkbox"
                    checked={showHandles}
                    onChange={e => setShowHandles(e.target.checked)}
                    style={checkboxStyle}
                  />
                  <span style={{
                    position: 'relative',
                    left: -26,
                    width: 18,
                    height: 18,
                    pointerEvents: 'none',
                    display: showHandles ? 'inline-block' : 'none',
                  }}>
                    {/* SVG checkmark, blue */}
                    <svg width="18" height="18" viewBox="0 0 18 18" style={{ position: 'absolute', top: 0, left: 0 }}>
                      <polyline points="4,9 8,13 14,5" stroke="#1976d2" strokeWidth="2.5" fill="none" />
                    </svg>
                  </span>
                  <span style={{ marginLeft: showHandles ? -8 : 0 }}>Show rotation handles</span>
                </label>
              </div>
            )}
          </div>
        )}
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

