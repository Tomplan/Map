import React, { useState, useEffect, useRef, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MapContainer, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import EventSpecialMarkers from '../EventSpecialMarkers';
import EventClusterMarkers from '../EventClusterMarkers';
import AdminMarkerPlacement from '../AdminMarkerPlacement';
import MapControls from './MapControls';
import { createIconCreateFunction } from '../../utils/clusterIcons';
import { getLogoPath } from '../../utils/getLogoPath';
import { syncRectangleLayers } from '../../utils/rectangleLayer';
import useAnalytics from '../../hooks/useAnalytics';
import useIsMobile from '../../utils/useIsMobile';
import { useOrganizationLogo } from '../../contexts/OrganizationLogoContext';
import { MAP_CONFIG, MAP_LAYERS } from '../../config/mapConfig';

import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet-search/dist/leaflet-search.src.css';
import 'leaflet-search';
import 'leaflet-minimap/dist/Control.MiniMap.min.css';
import 'leaflet-minimap';
import '../../assets/leaflet-search-custom.css';

// Utility functions
const createSearchText = (marker) => {
  return [marker.name, marker.glyph, marker.label].filter(Boolean).join(' | ');
};

const isMarkerDraggable = (marker, isAdminView) => {
  return isAdminView && marker && marker.coreLocked === false;
};

function EventMap({ isAdminView, markersState, updateMarker, selectedYear, selectedMarkerId, onMarkerSelect }) {
  const [infoButtonToggled, setInfoButtonToggled] = useState({});
  const [showLayersMenu, setShowLayersMenu] = useState(false);
  const [activeLayer, setActiveLayer] = useState(MAP_LAYERS[0].key);
  const [showRectanglesAndHandles, setShowRectanglesAndHandles] = useState(false);
  const [mapInstance, setMapInstance] = useState(null);
  const [searchLayer, setSearchLayer] = useState(null);
  const { organizationLogo } = useOrganizationLogo();
  const [searchParams, setSearchParams] = useSearchParams();

  const searchControlRef = useRef(null);
  const rectangleLayerRef = useRef(null);
  const hasProcessedFocus = useRef(false);
  const [focusMarkerId, setFocusMarkerId] = useState(null);

  // Create the iconCreateFunction with organization logo
  const iconCreateFunction = useMemo(
    () => createIconCreateFunction(organizationLogo),
    [organizationLogo]
  );
  
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const { trackMarkerView } = useAnalytics();

  const safeMarkers = useMemo(
    () => (Array.isArray(markersState) ? markersState : []),
    [markersState]
  );

  // Preload marker logos
  useEffect(() => {
    safeMarkers.forEach((marker) => {
      if (marker.logo) {
        const img = new window.Image();
        img.src = getLogoPath(marker.logo);
      }
    });
  }, [safeMarkers]);

  // Sync rectangles/handles
  useEffect(() => {
    if (!mapInstance) return;

    syncRectangleLayers({
      mapInstance,
      markers: safeMarkers,
      rectangleSize: MAP_CONFIG.RECTANGLE_SIZE,
      isAdminView,
      showRectanglesAndHandles,
      updateMarker,
      rectangleLayerRef,
    });
  }, [mapInstance, safeMarkers, isAdminView, showRectanglesAndHandles, updateMarker]);

  // Setup search layer and populate it with markers
  useEffect(() => {
    if (!mapInstance) return;

    // Create and populate search layer
    const layerGroup = L.layerGroup();
    
    safeMarkers.forEach((marker) => {
      if (marker.lat && marker.lng) {
        const searchText = createSearchText(marker);
        const leafletMarker = L.marker([marker.lat, marker.lng], {
          opacity: 0,
          interactive: false,
        });
        leafletMarker.feature = { type: 'Feature', properties: { searchText } };
        leafletMarker.bindPopup(marker.name || marker.label || '');
        // Store marker ID for later reference
        leafletMarker._markerId = marker.id;
        layerGroup.addLayer(leafletMarker);
      }
    });

    setSearchLayer(layerGroup);
  }, [mapInstance, safeMarkers]);

  // Setup search control once search layer is ready
  useEffect(() => {
    if (!mapInstance || !searchLayer) return;

    // Setup search control
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
      if (e?.layer) {
        const latlng = e.layer.getLatLng();
        const markerId = e.layer._markerId;
        
        if (markerId) {
          mapInstance.flyTo(latlng, MAP_CONFIG.SEARCH_ZOOM, { animate: true });
          
          // Set focus marker to open popup after animation
          setTimeout(() => {
            setFocusMarkerId(markerId);
          }, 800);
        }

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

  // Setup minimap control
  useEffect(() => {
    if (!mapInstance) return;

    // Setup minimap control only once
    if (!mapInstance._minimapControl) {
      const miniMapLayer = L.tileLayer(MAP_LAYERS[0].url, {
        attribution: '',
        minZoom: 0,
        maxZoom: 16,
      });

      const miniMapControl = new L.Control.MiniMap(miniMapLayer, {
        position: 'bottomright',
        width: MAP_CONFIG.MINIMAP.WIDTH,
        height: MAP_CONFIG.MINIMAP.HEIGHT,
        zoomLevelFixed: MAP_CONFIG.MINIMAP.ZOOM_LEVEL,
        toggleDisplay: true,
        centerFixed: MAP_CONFIG.DEFAULT_POSITION,
        aimingRectOptions: {
          color: MAP_CONFIG.MINIMAP.AIMING_COLOR,
          weight: 2,
          opacity: 0.9,
          fillOpacity: 0.1,
          fill: true,
        },
        shadowRectOptions: {
          color: MAP_CONFIG.MINIMAP.SHADOW_COLOR,
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
  }, [mapInstance]);

  // Handle focus parameter from URL (navigate from exhibitor list)
  useEffect(() => {
    if (!mapInstance || !safeMarkers.length || hasProcessedFocus.current) return;

    const focusId = searchParams.get('focus');
    if (focusId) {
      const markerId = parseInt(focusId, 10);
      const marker = safeMarkers.find((m) => m.id === markerId);

      if (marker && marker.lat && marker.lng) {
        // Zoom to marker with animation
        setTimeout(() => {
          mapInstance.flyTo([marker.lat, marker.lng], MAP_CONFIG.SEARCH_ZOOM, {
            animate: true,
            duration: 1,
          });
          // Set focus marker ID to trigger popup open
          setFocusMarkerId(markerId);
        }, 300);

        // Mark as processed and clear URL parameter
        hasProcessedFocus.current = true;
        setSearchParams({}, { replace: true });
      }
    }
  }, [mapInstance, safeMarkers, searchParams, setSearchParams]);

  const handleMapCreated = (mapOrEvent) => {
    const map = mapOrEvent?.target || mapOrEvent;
    setMapInstance(map);
  };

  const containerStyle = isAdminView
    ? {
        // Admin view: relative positioning to fit within flex parent
        height: '100%',
        width: '100%',
        position: 'relative',
        touchAction: 'pan-x pan-y',
        overflow: 'hidden',
      }
    : {
        // Public view: fixed full-screen positioning
        height: '100svh',
        width: '100vw',
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        touchAction: 'pan-x pan-y',
        overflow: 'hidden',
      };

  return (
    <div
      style={containerStyle}
      tabIndex={0}
      aria-label="Event Map"
      role="region"
    >
      <MapControls
        mapInstance={mapInstance}
        mapCenter={MAP_CONFIG.DEFAULT_POSITION}
        mapZoom={MAP_CONFIG.DEFAULT_ZOOM}
        searchControlRef={searchControlRef}
        isAdminView={isAdminView}
        showLayersMenu={showLayersMenu}
        setShowLayersMenu={setShowLayersMenu}
        activeLayer={activeLayer}
        setActiveLayer={setActiveLayer}
        showRectanglesAndHandles={showRectanglesAndHandles}
        setShowRectanglesAndHandles={setShowRectanglesAndHandles}
        MAP_LAYERS={MAP_LAYERS}
      />

      {isAdminView && (
        <AdminMarkerPlacement
          mapInstance={mapInstance}
          isAdminView={isAdminView}
          updateMarker={updateMarker}
        />
      )}

      <div
        id="map-container"
        className={isAdminView ? "w-full h-full" : "fixed inset-0 w-full h-full"}
        style={{
          zIndex: isAdminView ? 'auto' : 1,
          height: isAdminView ? '100%' : '100svh',
          touchAction: 'pan-x pan-y',
          overflow: 'hidden',
        }}
        aria-label={t('map.ariaLabel')}
      >
        <MapContainer
          center={MAP_CONFIG.DEFAULT_POSITION}
          zoom={MAP_CONFIG.DEFAULT_ZOOM}
          minZoom={MAP_CONFIG.MIN_ZOOM}
          maxZoom={MAP_CONFIG.MAX_ZOOM}
          zoomDelta={MAP_CONFIG.ZOOM_DELTA}
          zoomSnap={MAP_CONFIG.ZOOM_SNAP}
          zoomControl={false}
          style={{
            width: isAdminView ? '100%' : '100vw',
            height: isAdminView ? '100%' : '100svh'
          }}
          className="focus:outline-none focus:ring-2 focus:ring-primary"
          whenReady={handleMapCreated}
          attributionControl={false}
        >
          {MAP_LAYERS.filter((layer) => layer.key === activeLayer).map((layer) => (
            <TileLayer
              key={layer.key}
              attribution={layer.attribution}
              url={layer.url}
              maxZoom={MAP_CONFIG.MAX_ZOOM}
            />
          ))}

          <EventClusterMarkers
            safeMarkers={safeMarkers}
            infoButtonToggled={infoButtonToggled}
            setInfoButtonToggled={setInfoButtonToggled}
            isMobile={isMobile}
            updateMarker={updateMarker}
            isMarkerDraggable={(marker) => isMarkerDraggable(marker, isAdminView)}
            iconCreateFunction={iconCreateFunction}
            selectedYear={selectedYear}
            isAdminView={isAdminView}
            selectedMarkerId={selectedMarkerId}
            onMarkerSelect={onMarkerSelect}
            focusMarkerId={focusMarkerId}
            onFocusHandled={() => setFocusMarkerId(null)}
          />

          <EventSpecialMarkers
            safeMarkers={safeMarkers}
            infoButtonToggled={infoButtonToggled}
            setInfoButtonToggled={setInfoButtonToggled}
            isMobile={isMobile}
            updateMarker={updateMarker}
            isMarkerDraggable={(marker) => isMarkerDraggable(marker, isAdminView)}
            selectedMarkerId={selectedMarkerId}
            onMarkerSelect={onMarkerSelect}
            isAdminView={isAdminView}
            selectedYear={selectedYear}
          />
        </MapContainer>
      </div>
    </div>
  );
}

EventMap.propTypes = {
  isAdminView: PropTypes.bool,
  markersState: PropTypes.array,
  updateMarker: PropTypes.func.isRequired,
  selectedYear: PropTypes.number,
  selectedMarkerId: PropTypes.number,
  onMarkerSelect: PropTypes.func,
};

EventMap.defaultProps = {
  isAdminView: false,
  markersState: [],
  selectedYear: new Date().getFullYear(),
  selectedMarkerId: null,
  onMarkerSelect: null,
};

export default EventMap;