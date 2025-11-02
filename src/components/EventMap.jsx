
import React, { useState, useEffect } from 'react';
import { iconCreateFunction } from '../utils/clusterIcons';
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
  handleZoomIn,
  handleZoomOut,
  handleHome,
  handleCustomSearchClick
} from '../utils/mapControls';
import {
  getMarkerAngle,
  rotatePoint,
  metersToLat,
  metersToLng,
  metersToLatInv,
  metersToLngInv
} from '../utils/geometryHelpers';
import { getIconPath } from '../utils/getIconPath';
// Marker state is now provided via props from App.jsx
import useAnalytics from '../hooks/useAnalytics';
import { createNewMarker, generateUniqueMarkerId } from '../utils/markerFactory';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
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

  // Store the Leaflet Search control instance
  const searchControlRef = React.useRef(null);
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

  // Preload all marker logo images to improve tooltip smoothness
  React.useEffect(() => {
    safeMarkers.forEach(marker => {
      if (marker.logo) {
        const img = new window.Image();
        img.src = getLogoPath(marker.logo);
      }
    });
  }, [safeMarkers]);

    // Helper: determine if marker is draggable (admin only, lock off)
  function isMarkerDraggable(marker) {
    // Marker is draggable if admin view is active and coreLocked is false
    return isAdminView && marker && marker.coreLocked === false;
  }

  // Track marker placement mode for admin
  const [isPlacingMarker, setIsPlacingMarker] = useState(false);
  // New: Admin marker ID entry modal
  const [showIdModal, setShowIdModal] = useState(false);
  const [pendingMarkerId, setPendingMarkerId] = useState("");
  const [idError, setIdError] = useState("");



  // Handler for map click to add marker (with admin ID check)
  useEffect(() => {
    if (!isPlacingMarker || !mapInstance || !pendingMarkerId) return;
    const onMapClick = (e) => {
      const latlng = e.latlng;
      // Use entered ID for marker
      const newMarker = { ...createNewMarker({ lat: latlng.lat, lng: latlng.lng }), id: Number(pendingMarkerId) };
      if (typeof updateMarker === 'function') {
        updateMarker(newMarker.id, newMarker, { add: true });
      }
      setIsPlacingMarker(false);
      setPendingMarkerId("");
      mapInstance.off('click', onMapClick);
    };
    mapInstance.on('click', onMapClick);
    // Cleanup in case placement is cancelled
    return () => {
      mapInstance.off('click', onMapClick);
    };
  }, [isPlacingMarker, mapInstance, updateMarker, pendingMarkerId]);

  // Helper: check if marker ID exists in Supabase
  async function checkMarkerIdExists(id) {
    try {
      const { supabase } = await import('../supabaseClient');
      const tables = ['Markers_Core', 'Markers_Appearance', 'Markers_Content', 'Markers_Admin'];
      for (const table of tables) {
        const { data, error } = await supabase.from(table).select('id').eq('id', Number(id));
        if (error) return false; // ignore error, treat as not found
        if (data && data.length > 0) return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  }

  // Handler for admin add marker button
  const handleAdminAddMarker = () => {
    setShowIdModal(true);
    setPendingMarkerId("");
    setIdError("");
  };

  // Handler for modal confirm
  const handleIdModalConfirm = async () => {
    if (!pendingMarkerId || isNaN(Number(pendingMarkerId))) {
      setIdError("Please enter a valid numeric ID.");
      return;
    }
    const exists = await checkMarkerIdExists(pendingMarkerId);
    if (exists) {
      setIdError("ID already exists. Please choose another.");
      return;
    }
    setShowIdModal(false);
    setIsPlacingMarker(true);
    setIdError("");
  };

  // Handler for modal cancel
  const handleIdModalCancel = () => {
    setShowIdModal(false);
    setPendingMarkerId("");
    setIdError("");
  };

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
        // Combine name and booth number for search
        const searchText = [marker.name, marker.boothNumber, marker.label]
          .filter(Boolean)
          .join(' | ');
        const leafletMarker = L.marker([marker.lat, marker.lng], {
          opacity: 0, // Hide from map
          interactive: false // Prevent popups/tooltips from being triggered
        });
        // Patch: add feature.properties.searchText for Leaflet Search compatibility
        leafletMarker.feature = {
          type: 'Feature',
          properties: {
            searchText
          }
        };
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
        propertyName: 'searchText', // Search by combined name/booth/label
        initial: false,
        zoom: 20,
        marker: {
          icon: false,
          animate: true
        },
        textPlaceholder: 'Search for name or booth...',
        position: 'topleft',
      });
      mapInstance.addControl(searchControl);
      searchControlRef.current = searchControl;
      // Restore plugin's default behavior: do not modify search input ids
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
  const zoomIn = () => handleZoomIn(mapInstance);
  const zoomOut = () => handleZoomOut(mapInstance);
  const goHome = () => handleHome(mapInstance, mapCenter, mapZoom);
  const customSearchClick = () => handleCustomSearchClick(searchControlRef);

  return (
    <div
      style={{
        height: '100svh',
        height: '100dvh',
        height: '100vh',
        width: '100vw',
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        touchAction: 'pan-x pan-y',
        overflow: 'hidden'
      }}
      tabIndex={0}
      aria-label="Event Map"
      role="region"
    >
      {/* Zoom, home, and custom search controls + admin layers popover */}
      <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <button
          onClick={goHome}
          aria-label="Home"
          className="bg-white rounded-full shadow p-2 flex items-center justify-center"
          style={{ width: 44, height: 44 }}
        >
          <MdHome size={28} color="#1976d2" aria-hidden="true" />
          <span className="sr-only">Home</span>
        </button>
        <button
          onClick={zoomIn}
          aria-label="Zoom in"
          className="bg-white rounded-full shadow p-2 mb-2 flex items-center justify-center"
          style={{ width: 44, height: 44 }}
        >
          <MdAdd size={28} color="#1976d2" aria-hidden="true" />
          <span className="sr-only">Zoom in</span>
        </button>
        <button
          onClick={zoomOut}
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
      {/* Admin-only add marker button (top-left) */}
      {/* Admin-only add marker button is hidden for now, but code is preserved for later use , add: false && */}
      {isAdminView && (
        <>
          <button
            onClick={handleAdminAddMarker}
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
              cursor: isPlacingMarker ? 'crosshair' : 'pointer',
              background: isPlacingMarker ? '#e3f2fd' : 'white'
            }}
            title={isPlacingMarker ? "Click on map to place marker" : "Add marker"}
          >
            <Icon path={mdiMapMarkerPlus} size={1.5} color="#1976d2" aria-hidden="true" style={{ width: '42px', height: '42px' }} />
            <span className="sr-only">Add marker</span>
          </button>
          {/* Modal for marker ID entry */}
          {showIdModal && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              background: 'rgba(0,0,0,0.3)',
              zIndex: 2000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <div style={{
                background: 'white',
                borderRadius: 8,
                boxShadow: '0 2px 16px rgba(25,118,210,0.15)',
                padding: 32,
                minWidth: 320,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}>
                <h2 style={{ color: '#1976d2', fontWeight: 700, marginBottom: 16 }}>Enter Marker ID</h2>
                <input
                  type="number"
                  value={pendingMarkerId}
                  onChange={e => setPendingMarkerId(e.target.value)}
                  style={{
                    fontSize: 18,
                    padding: '8px 12px',
                    border: '2px solid #1976d2',
                    borderRadius: 4,
                    marginBottom: 12,
                    width: '100%'
                  }}
                  placeholder="Marker ID (integer)"
                  min={1}
                />
                {idError && <div style={{ color: 'red', marginBottom: 8 }}>{idError}</div>}
                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    onClick={handleIdModalConfirm}
                    style={{
                      background: '#1976d2',
                      color: 'white',
                      border: 'none',
                      borderRadius: 4,
                      padding: '8px 20px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >Confirm</button>
                  <button
                    onClick={handleIdModalCancel}
                    style={{
                      background: '#eee',
                      color: '#1976d2',
                      border: 'none',
                      borderRadius: 4,
                      padding: '8px 20px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >Cancel</button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
      {/* Map container */}
      <div
        id="map-container"
        className="fixed inset-0 w-full h-full"
        style={{
          zIndex: 1,
          height: '100svh',
          height: '100dvh',
          height: '100vh',
          touchAction: 'pan-x pan-y',
          overflow: 'hidden'
        }}
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
            disableClusteringAtZoom={17}
            maxClusterRadius={400}
            iconCreateFunction={iconCreateFunction}
          >
            {safeMarkers.filter(marker => marker.id < 1001).map(marker => {
              let pos = [marker.lat, marker.lng];
              let iconFile = marker.iconUrl;
              if (!iconFile) {
                iconFile = `${marker.type || 'default'}.svg`;
              }
              // Always resolve iconFile using getIconPath for correct BASE_URL
              iconFile = getIconPath(iconFile);
              const icon = createMarkerIcon({
                className: marker.type ? `marker-icon marker-type-${marker.type}` : 'marker-icon',
                prefix: marker.prefix,
                iconUrl: iconFile,
                iconSize: Array.isArray(marker.iconSize) ? marker.iconSize : [15, 25],
                glyph: marker.glyph || '',
                glyphColor: marker.glyphColor || 'white',
                glyphSize: marker.glyphSize || '9px',
                glyphAnchor: marker.glyphAnchor || [0, -4]
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
                  {/* Only one tooltip per marker: logo and name */}
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
              iconFile = `${marker.type || 'glyph-marker-icon-blue'}.svg`;
            }
            // Always resolve iconFile using getIconPath for correct BASE_URL
            iconFile = getIconPath(iconFile);
            const icon = createMarkerIcon({
              className: marker.type ? `marker-icon marker-type-${marker.type}` : 'marker-icon',
              prefix: marker.prefix,
              iconUrl: iconFile,
              iconSize: Array.isArray(marker.iconSize) ? marker.iconSize : [17, 28],
              glyph: marker.glyph || '?',
              glyphColor: marker.glyphColor || 'white',
              glyphSize: marker.glyphSize || '12px',
              glyphAnchor: marker.glyphAnchor || [0, -5]
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
                {/* Only one tooltip per marker: logo and name */}
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

