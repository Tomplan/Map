import React, { useState, useEffect } from 'react';
import Icon from '@mdi/react';
import { mdiLayersTriple, mdiMapMarkerPlus } from '@mdi/js';
import { useTranslation } from 'react-i18next';
import { MdAdd, MdRemove, MdHome } from 'react-icons/md';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, CircleMarker, useMap } from 'react-leaflet';
import { getLogoPath } from '../utils/getLogoPath';
import L, { icon } from 'leaflet';
import 'leaflet-search/dist/leaflet-search.src.css';
import 'leaflet-search';
import '../assets/leaflet-search-custom.css';
import { createMarkerIcon, createMarkerPopupHTML } from '../utils/markerIcons';
import { syncRectangleLayers } from '../utils/rectangleLayer';
import {
  getMarkerAngle,
  rotatePoint,
  metersToLat,
  metersToLng,
  metersToLatInv,
  metersToLngInv
} from '../utils/geometryHelpers';
// Marker state is now provided via props from App.jsx
import useAnalytics from '../hooks/useAnalytics';
import { createNewMarker, generateUniqueMarkerId } from '../utils/markerFactory';
import 'leaflet/dist/leaflet.css';
import 'react-leaflet-markercluster/styles';
import MarkerClusterGroup from 'react-leaflet-markercluster';

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
  const [showRectanglesAndHandles, setShowRectanglesAndHandles] = useState(false);
  const [mapInstance, setMapInstance] = useState(null);
  // Hidden LayerGroup for search markers
  const [searchLayer, setSearchLayer] = useState(null);
  const DEFAULT_POSITION = [51.898945656392904, 5.779029262641933];
  const DEFAULT_ZOOM = 17; // Default zoom level
  const { trackMarkerView } = useAnalytics();
  // Ensure markers is always an array, memoized for hook compliance
  const safeMarkers = React.useMemo(() => Array.isArray(markersState) ? markersState : [], [markersState]);

  // Rectangle size from appearanceTab (default [6, 6])
  // TODO: Replace with actual appearanceTab.Rectangle prop/state when available
  const rectangleSize = [6, 6]; // meters, [width, height]

  // Rectangle/handle LayerGroup (independent from marker LayerGroup)
  const rectangleLayerRef = React.useRef(null);

    // Helper: determine if marker is draggable (admin only, lock off)
  function isMarkerDraggable(marker) {
    // Marker is draggable if admin view is active and coreLocked is false
    return isAdminView && marker && marker.coreLocked === false;
  }

  // Track drag state for marker creation
  const [isDraggingMarker, setIsDraggingMarker] = useState(false);


  // Handler for drop event on map
  function handleMapDrop(e) {
    if (!isDraggingMarker || !mapInstance) return;
    // Get pixel position from drop event
    const rect = e.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    // Convert pixel to lat/lng
    const latlng = mapInstance.containerPointToLatLng([x, y]);
    // Create new marker object using factory
    const newMarker = createNewMarker({ lat: latlng.lat, lng: latlng.lng });
    // Add marker to state via updateMarker or parent handler
    if (typeof updateMarker === 'function') {
      updateMarker(newMarker.id, newMarker, { add: true });
    }
    setIsDraggingMarker(false);
    e.preventDefault();
  }

  // Attach drop event to map container
  useEffect(() => {
    const mapEl = document.getElementById('map-container');
    if (!mapEl) return;
    function onDrop(e) { handleMapDrop(e); }
    function onDragOver(e) { if (isDraggingMarker) e.preventDefault(); }
    mapEl.addEventListener('drop', onDrop);
    mapEl.addEventListener('dragover', onDragOver);
    return () => {
      mapEl.removeEventListener('drop', onDrop);
      mapEl.removeEventListener('dragover', onDragOver);
    };
  }, [isDraggingMarker, mapInstance]);

  // Persistent LayerGroup for rectangles/handles
  // Only update rectangles/handles when marker data changes, not on zoom
  useEffect(() => {
    syncRectangleLayers({
      mapInstance,
      markers: safeMarkers,
      rectangleSize,
      isAdminView,
      showRectanglesAndHandles,
      updateMarker,
      rectangleLayerRef
    });
    // Rectangle/handle layers are independent from main marker layers
  }, [mapInstance, markersState, rectangleSize, isAdminView, showRectanglesAndHandles]);


  // Create and sync hidden LayerGroup for search markers
  useEffect(() => {
    if (!mapInstance) return;
    // Create LayerGroup if not exists
    let layerGroup = searchLayer;
    if (!layerGroup) {
      layerGroup = L.layerGroup();
      setSearchLayer(layerGroup);
    }
    // Remove all layers
    layerGroup.clearLayers();
    // Add Leaflet marker objects for each marker
    safeMarkers.forEach(marker => {
      if (marker.lat && marker.lng) {
        const leafletMarker = L.marker([marker.lat, marker.lng], {
          title: marker.name || marker.label || '',
          opacity: 0, // Hide from map
        });
        leafletMarker.bindPopup(marker.name || marker.label || '');
        layerGroup.addLayer(leafletMarker);
      }
    });
  }, [mapInstance, safeMarkers, searchLayer]);

  // Add Leaflet Search control when map and searchLayer are ready
  useEffect(() => {
    if (mapInstance && searchLayer) {
      const searchControl = new L.Control.Search({
        layer: searchLayer,
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
  }, [mapInstance, searchLayer]);

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
      <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <button
          onClick={handleHome}
          aria-label="Home"
          className="bg-white rounded-full shadow p-2 flex items-center justify-center"
          style={{ width: 44, height: 44 }}
        >
          <MdHome size={28} color="#1976d2" aria-hidden="true" />
          <span className="sr-only">Home</span>
        </button>
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

        {/* Admin-only layers button and popover */}
        {isAdminView && (
          <div style={{ position: 'relative' }}>
            <button
              aria-label="Map layers"
              className="bg-white rounded-full shadow p-2 flex items-center justify-center mt-0 hover:bg-gray-100 focus:outline-none"
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
                    checked={showRectanglesAndHandles}
                    onChange={e => setShowRectanglesAndHandles(e.target.checked)}
                    style={checkboxStyle}
                  />
                  <span style={{
                    position: 'relative',
                    left: -26,
                    width: 18,
                    height: 18,
                    pointerEvents: 'none',
                    display: showRectanglesAndHandles ? 'inline-block' : 'none',
                  }}>
                    {/* SVG checkmark, blue */}
                    <svg width="18" height="18" viewBox="0 0 18 18" style={{ position: 'absolute', top: 0, left: 0 }}>
                      <polyline points="4,9 8,13 14,5" stroke="#1976d2" strokeWidth="2.5" fill="none" />
                    </svg>
                  </span>
                  <span style={{ marginLeft: showRectanglesAndHandles ? -8 : 0 }}>Booth Surface</span>
                </label>
              </div>
            )}
          </div>
        )}
      </div>
      {/* Admin-only draggable add marker button below search (top-left) */}
      {isAdminView && (
        <button
          draggable
          onDragStart={() => setIsDraggingMarker(true)}
          onDragEnd={() => setIsDraggingMarker(false)}
          aria-label="Add marker"
          className="bg-white rounded-full shadow p-2 flex items-center justify-center"
          style={{
            position: 'absolute',
            left: 10,
            top: 60,
            zIndex: 1001,
            width: 44,
            height: 44,
            border: 'none',
            cursor: 'grab'
          }}
          title="Drag to add marker"
        >
          <Icon path={mdiMapMarkerPlus}  size={28} color="#1976d2" aria-hidden="true" />
          <span className="sr-only">Add marker</span>
        </button>
      )}
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

          {/* Clustered markers (id < 1001) */}
          <MarkerClusterGroup
            chunkedLoading={true}
            showCoverageOnHover={true}
            spiderfyOnMaxZoom={false}
            removeOutsideVisibleBounds={true}
            disableClusteringAtZoom={18}
            maxClusterRadius={400}
          >
            {safeMarkers.filter(marker => marker.id < 1001).map(marker => {
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
                glyph: marker.glyph || '',
                glyphColor: marker.glyphColor || 'white',
                glyphSize: marker.glyphSize || '13px',
                glyphAnchor: marker.glyphAnchor || [0,0]
              });
              // Tooltip content: logo and name
              const logoPath = marker.logo ? getLogoPath(marker.logo) : null;
              const tooltipContent = (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 1,
                    padding: 0,
                    whiteSpace: 'nowrap',
                    minWidth: 'max-content',
                    // background: '#e7f2fcff',
                    borderRadius: 2,
                    boxShadow: '0 2px 8px rgba(25, 118, 210, 0.08)'
                  }}
                >
                  {logoPath && (
                    <img
                      src={logoPath}
                      alt={marker.name || 'Logo'}
                      style={{
                         maxWidth: 120,
                         maxHeight: 80,
                        // minWidth: 40,
                        // minHeight: 40,
                        width: 'auto',
                        height: 'auto',
                        objectFit: 'contain',
                        borderRadius: '0px',
                        marginBottom: 0,
                        padding: 0,
                        // background: '#d2e3f4ff'
                      }}
                    />
                  )}
                  <span style={{ fontWeight: 600, whiteSpace: 'nowrap', color: '#1976d2' }}>{marker.name}</span>
                </div>
              );
              const labelText = getMarkerLabel(marker.label);
              // Use helper for draggable logic
              const isDraggable = isMarkerDraggable(marker);
              return (
                <Marker
                  key={`${marker.id}-${marker.coreLocked}-${marker.appearanceLocked}-${marker.contentLocked}-${marker.adminLocked}`}
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
                  <Popup onOpen={() => trackMarkerView(marker.id)}>
                    <div dangerouslySetInnerHTML={{ __html: createMarkerPopupHTML(marker) }} />
                  </Popup>
                  <Tooltip direction="top" offset={[0, -32]} opacity={1} permanent={false}>
                    {tooltipContent}
                  </Tooltip>
                </Marker>
              );
            })}
          </MarkerClusterGroup>

          {/* Special markers (id >= 1001) - never clustered */}
          {safeMarkers.filter(marker => marker.id >= 1001).map(marker => {
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
              glyph: marker.glyph || '?',
              glyphColor: marker.glyphColor || 'white',
              glyphSize: marker.glyphSize || '18px',
              glyphAnchor: marker.glyphAnchor || [0,0]
            });
            // Tooltip content: logo and name
            const logoPath = marker.logo ? getLogoPath(marker.logo) : null;
            const tooltipContent = (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 1,
                  padding: 0,
                  whiteSpace: 'nowrap',
                  minWidth: 'max-content',
                  // background: '#e7f2fcff',
                  borderRadius: 2,
                  boxShadow: '0 2px 8px rgba(25, 118, 210, 0.08)'
                }}
              >
                {logoPath && (
                  <img
                    src={logoPath}
                    alt={marker.name || 'Logo'}
                    style={{
                       maxWidth: 120,
                       maxHeight: 80,
                      // minWidth: 40,
                      // minHeight: 40,
                      width: 'auto',
                      height: 'auto',
                      objectFit: 'contain',
                      borderRadius: '0px',
                      marginBottom: 0,
                      padding: 0,
                      // background: '#d2e3f4ff'
                    }}
                  />
                )}
                <span style={{ fontWeight: 600, whiteSpace: 'nowrap', color: '#1976d2' }}>{marker.name}</span>
              </div>
            );
            const labelText = getMarkerLabel(marker.label);
            // Use helper for draggable logic
            const isDraggable = isMarkerDraggable(marker);
            const eventHandlers = isDraggable ? {
              dragend: (e) => {
                const { lat, lng } = e.target.getLatLng();
                updateMarker(marker.id, { lat, lng });
              }
            } : {};
            return (
              <Marker
                key={`${marker.id}-${marker.coreLocked}-${marker.appearanceLocked}-${marker.contentLocked}-${marker.adminLocked}`}
                position={pos}
                icon={icon}
                draggable={isDraggable}
                eventHandlers={eventHandlers}
              >
                <Popup onOpen={() => trackMarkerView(marker.id)}>
                  <div dangerouslySetInnerHTML={{ __html: createMarkerPopupHTML(marker) }} />
                </Popup>
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

