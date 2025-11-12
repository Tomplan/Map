import React, { useState, useEffect } from 'react';
import EventSpecialMarkers from './EventSpecialMarkers';
import EventClusterMarkers from './EventClusterMarkers';
import AdminMarkerPlacement from './AdminMarkerPlacement';
import { iconCreateFunction } from '../utils/clusterIcons';
import Icon from '@mdi/react';
import { mdiLayersTriple, mdiMapMarkerPlus } from '@mdi/js';
import { useTranslation } from 'react-i18next';
import { MdAdd, MdRemove, MdHome } from 'react-icons/md';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Tooltip,
  CircleMarker,
  useMap,
} from 'react-leaflet';
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
  handleCustomSearchClick,
} from '../utils/mapControls';
import {
  getMarkerAngle,
  rotatePoint,
  metersToLat,
  metersToLng,
  metersToLatInv,
  metersToLngInv,
} from '../utils/geometryHelpers';
import { getIconPath } from '../utils/getIconPath';
// Marker state is now provided via props from App.jsx
import useAnalytics from '../hooks/useAnalytics';
import { createNewMarker, generateUniqueMarkerId } from '../utils/markerFactory';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import 'leaflet-minimap/dist/Control.MiniMap.min.css';
import 'leaflet-minimap';
import useIsMobile from '../utils/useIsMobile';


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
    attribution:
      'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  },
];

function EventMap({ isAdminView, markersState, updateMarker }) {
  // Track button toggle state per marker (mobile only)
  const [infoButtonToggled, setInfoButtonToggled] = useState({});
  // Device recognition: simple user agent check
  const isMobile = useIsMobile();

  // Store the Leaflet Search control instance
  // Controlled tooltip/popup state
  // const [tooltipOpen, setTooltipOpen] = useState(null);
  // const [popupOpen, setPopupOpen] = useState(null);
  const searchControlRef = React.useRef(null);
  const { t } = useTranslation();
  // Layer selection state (admin only)
  const [showLayersMenu, setShowLayersMenu] = useState(false);
  const [activeLayer, setActiveLayer] = useState(MAP_LAYERS[0].key);
  const [showRectanglesAndHandles, setShowRectanglesAndHandles] = useState(false);
  const [mapInstance, setMapInstance] = useState(null);
  // Hidden LayerGroup for search markers
  const [searchLayer, setSearchLayer] = useState(null);
  const DEFAULT_POSITION = [51.898095078807025, 5.772961378097534];
  const DEFAULT_ZOOM = 17; // Default zoom level
  const { trackMarkerView } = useAnalytics();
  // Ensure markers is always an array, memoized for hook compliance
  const safeMarkers = React.useMemo(
    () => (Array.isArray(markersState) ? markersState : []),
    [markersState],
  );

  // Rectangle size from appearanceTab (default [6, 6])
  // TODO: Replace with actual appearanceTab.Rectangle prop/state when available
  const rectangleSize = [6, 6]; // meters, [width, height]

  // Rectangle/handle LayerGroup (independent from marker LayerGroup)
  const rectangleLayerRef = React.useRef(null);

  // Preload all marker logo images to improve tooltip smoothness
  React.useEffect(() => {
    safeMarkers.forEach((marker) => {
      if (marker.logo) {
        const img = new window.Image();
        img.src = getLogoPath(marker.logo);
      }
    });
  }, [safeMarkers]);

  // Initialize Leaflet print control and attach to mapInstance.printControl
  React.useEffect(() => {
    if (mapInstance && !mapInstance.printControl && window.L && L.control && L.control.browserPrint) {
      const printControl = L.control.browserPrint({
        position: 'topleft',
        hideControlContainer: true,
        elementsToHide: [
          '.branding-bar',
          '.dashboard-btn',
          '.admin-panel',
          '.map-control-button',
          '.leaflet-control-minimap',
          '.leaflet-top',
          '.leaflet-bottom',
          '.leaflet-bar',
          '.leaflet-control',
          '.leaflet-control-container',
          '.leaflet-control-attribution',
          '.leaflet-control-zoom',
          '.leaflet-control-layers',
          '.leaflet-control-search',
          '.leaflet-control-browser-print',
          '.leaflet-control-custom',
          '.feedback-toggle',
          '.feedback-form',
          '.minimap',
          '.map-controls',
          '.map-control',
          '.language-toggle',
          '.map-controls-print-hide',
        ].join(', '),
      }).addTo(mapInstance);
      mapInstance.printControl = printControl;
    }
  }, [mapInstance]);

  // Helper: determine if marker is draggable (admin only, lock off)
  function isMarkerDraggable(marker) {
    // Marker is draggable if admin view is active and coreLocked is false
    return isAdminView && marker && marker.coreLocked === false;
  }

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
      rectangleLayerRef,
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
    safeMarkers.forEach((marker) => {
      if (marker.lat && marker.lng) {
        // Combine name and glyph text for search
        const searchText = [marker.name, marker.glyph, marker.label]
          .filter(Boolean)
          .join(' | ');
        const leafletMarker = L.marker([marker.lat, marker.lng], {
          opacity: 0, // Hide from map
          interactive: false, // Prevent popups/tooltips from being triggered
        });
        // Patch: add feature.properties.searchText for Leaflet Search compatibility
        leafletMarker.feature = {
          type: 'Feature',
          properties: {
            searchText,
          },
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
        zoom: 21,
        marker: {
          icon: false,
          animate: true, // draw red cicle around found marker
        },
        textPlaceholder: 'Search for name or booth...',
        position: 'topleft',
      });
      mapInstance.addControl(searchControl);
      searchControlRef.current = searchControl;
      // Add MiniMap control (bottomright)
      if (!mapInstance._minimapControl) {
        const miniMapLayer = L.tileLayer(MAP_LAYERS[0].url, {
          attribution: '',
          minZoom: 0,
          maxZoom: 16,
        });
        const miniMapControl = new L.Control.MiniMap(miniMapLayer, {
          position: 'bottomright',
          width: 120,
          height: 120,
          zoomLevelFixed: 15,
          toggleDisplay: true,
          centerFixed: DEFAULT_POSITION,
          aimingRectOptions: {
            color: '#1976d2', // app primary blue
            weight: 2,
            opacity: 0.9,
            fillOpacity: 0.1,
            fill: true,
          },
          shadowRectOptions: {
            color: '#90caf9', // lighter blue shadow
            weight: 1,
            opacity: 0.5,
            fillOpacity: 0.05,
            fill: true,
          },
          strings: {
            hideText: 'Hide MiniMap',
            showText: 'Show MiniMap',
          },
        });
        miniMapControl.addTo(mapInstance);
        mapInstance._minimapControl = miniMapControl;
      }
      // Fly to marker when search result is found
      searchControl.on('search:locationfound', function (e) {
        if (e && e.layer && e.layer.getLatLng) {
          const latlng = e.layer.getLatLng();
          mapInstance.flyTo(latlng, 21, { animate: true });
          // Auto-close the search box
          if (searchControl._input) searchControl._input.blur();
          if (searchControl.hideAlert) searchControl.hideAlert();
          if (searchControl.collapse) searchControl.collapse();
        }
      });
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
        overflow: 'hidden',
      }}
      tabIndex={0}
      aria-label="Event Map"
      role="region"
    >
      {/* Zoom, home, and custom search controls + admin layers popover */}
      <div
        style={{
          position: 'absolute',
          top: 10,
          right: 10,
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
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
              onClick={() => setShowLayersMenu((v) => !v)}
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
                {MAP_LAYERS.map((layer) => (
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
                <label
                  className="flex items-center px-2 py-1 cursor-pointer hover:bg-blue-50 rounded"
                  style={{ color: '#1976d2' }}
                >
                  <input
                    type="checkbox"
                    checked={showRectanglesAndHandles}
                    onChange={(e) => setShowRectanglesAndHandles(e.target.checked)}
                    style={checkboxStyle}
                  />
                  <span
                    style={{
                      position: 'relative',
                      left: -26,
                      width: 18,
                      height: 18,
                      pointerEvents: 'none',
                      display: showRectanglesAndHandles ? 'inline-block' : 'none',
                    }}
                  >
                    {/* SVG checkmark, blue */}
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 18 18"
                      style={{ position: 'absolute', top: 0, left: 0 }}
                    >
                      <polyline
                        points="4,9 8,13 14,5"
                        stroke="#1976d2"
                        strokeWidth="2.5"
                        fill="none"
                      />
                    </svg>
                  </span>
                  <span style={{ marginLeft: showRectanglesAndHandles ? -8 : 0 }}>
                    Booth Surface
                  </span>
                </label>
              </div>
            )}
          </div>
        )}
      </div>
      {isAdminView && (
        <AdminMarkerPlacement
          isAdminView={isAdminView}
          mapInstance={mapInstance}
          updateMarker={updateMarker}
        />
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
          overflow: 'hidden',
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
          {MAP_LAYERS.filter((layer) => layer.key === activeLayer).map((layer) => (
            <TileLayer
              key={layer.key}
              attribution={layer.attribution}
              url={layer.url}
              maxZoom={22}
            />
          ))}

          {/* Clustered markers (id < 1001) */}
          <EventClusterMarkers
            safeMarkers={safeMarkers}
            infoButtonToggled={infoButtonToggled}
            setInfoButtonToggled={setInfoButtonToggled}
            isMobile={isMobile}
            updateMarker={updateMarker}
            isMarkerDraggable={isMarkerDraggable}
            iconCreateFunction={iconCreateFunction}
          />

          {/* Special markers (id >= 1001) - never clustered */}
          <EventSpecialMarkers
            safeMarkers={safeMarkers}
            infoButtonToggled={infoButtonToggled}
            setInfoButtonToggled={setInfoButtonToggled}
            isMobile={isMobile}
            updateMarker={updateMarker}
            isMarkerDraggable={isMarkerDraggable}
          />
        </MapContainer>
      </div>
    </div>
  );
}

export default EventMap;
