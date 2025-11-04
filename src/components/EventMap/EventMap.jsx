import React, { useState, useEffect, useRef, useMemo } from 'react';
import EventSpecialMarkers from '../EventSpecialMarkers';
import EventClusterMarkers from '../EventClusterMarkers';
import AdminMarkerPlacement from '../AdminMarkerPlacement';
import MapControls from './MapControls';
import { iconCreateFunction } from '../../utils/clusterIcons';
import { useTranslation } from 'react-i18next';
import { MapContainer, TileLayer } from 'react-leaflet';
import { getLogoPath } from '../../utils/getLogoPath';
import { syncRectangleLayers } from '../../utils/rectangleLayer';
import useAnalytics from '../../hooks/useAnalytics';
import useIsMobile from '../../utils/useIsMobile';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet-search/dist/leaflet-search.src.css';
import 'leaflet-search';
import 'leaflet-minimap/dist/Control.MiniMap.min.css';
import 'leaflet-minimap';
import '../../assets/leaflet-search-custom.css';

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
  const [infoButtonToggled, setInfoButtonToggled] = useState({});
  const [showLayersMenu, setShowLayersMenu] = useState(false);
  const [activeLayer, setActiveLayer] = useState(MAP_LAYERS[0].key);
  const [showRectanglesAndHandles, setShowRectanglesAndHandles] = useState(false);
  const [mapInstance, setMapInstance] = useState(null);
  const [searchLayer, setSearchLayer] = useState(null);
  const searchControlRef = useRef(null);
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const { trackMarkerView } = useAnalytics();

  const safeMarkers = useMemo(() => (Array.isArray(markersState) ? markersState : []), [
    markersState,
  ]);

  const rectangleLayerRef = useRef(null);
  const DEFAULT_POSITION = [51.898095078807025, 5.772961378097534];
  const DEFAULT_ZOOM = 17;
  const mapCenter = DEFAULT_POSITION;
  const mapZoom = DEFAULT_ZOOM;

  const rectangleSize = [6, 6];

  // Preload marker logos
  useEffect(() => {
    safeMarkers.forEach((marker) => {
      if (marker.logo) {
        const img = new window.Image();
        img.src = getLogoPath(marker.logo);
      }
    });
  }, [safeMarkers]);

  function isMarkerDraggable(marker) {
    return isAdminView && marker && marker.coreLocked === false;
  }

  // Sync rectangles/handles
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
  }, [mapInstance, markersState, rectangleSize, isAdminView, showRectanglesAndHandles]);

  // Hidden search LayerGroup
  useEffect(() => {
    if (!mapInstance) return;
    let layerGroup = searchLayer;
    if (!layerGroup) {
      layerGroup = window.L.layerGroup();
      setSearchLayer(layerGroup);
    }
    layerGroup.clearLayers();
    safeMarkers.forEach((marker) => {
      if (marker.lat && marker.lng) {
        const searchText = [marker.name, marker.boothNumber, marker.label].filter(Boolean).join(' | ');
        const leafletMarker = window.L.marker([marker.lat, marker.lng], { opacity: 0, interactive: false });
        leafletMarker.feature = { type: 'Feature', properties: { searchText } };
        leafletMarker.bindPopup(marker.name || marker.label || '');
        layerGroup.addLayer(leafletMarker);
      }
    });
  }, [mapInstance, safeMarkers, searchLayer]);

  // Map created callback
  const handleMapCreated = (mapOrEvent) => {
    if (mapOrEvent && mapOrEvent.target) {
      setMapInstance(mapOrEvent.target);
    } else {
      setMapInstance(mapOrEvent);
    }
  };

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
      {/* Map controls */}
      <MapControls
  mapInstance={mapInstance}
  mapCenter={mapCenter}
  mapZoom={mapZoom}
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
        <AdminMarkerPlacement mapInstance={mapInstance} isAdminView={isAdminView} updateMarker={updateMarker} />
      )}

      <div
        id="map-container"
        className="fixed inset-0 w-full h-full"
        style={{ zIndex: 1, height: '100svh', height: '100dvh', height: '100vh', touchAction: 'pan-x pan-y', overflow: 'hidden' }}
        aria-label={t('map.ariaLabel')}
      >
        <MapContainer
          center={DEFAULT_POSITION}
          zoom={DEFAULT_ZOOM}
          minZoom={14}
          maxZoom={22}
          zoomDelta={0.5}
          zoomSnap={0.5}
          zoomControl={false}
          style={{ width: '100vw', height: '100vh' }}
          className="focus:outline-none focus:ring-2 focus:ring-primary"
          whenReady={handleMapCreated}
          attributionControl={false}
        >
          {MAP_LAYERS.filter((layer) => layer.key === activeLayer).map((layer) => (
            <TileLayer key={layer.key} attribution={layer.attribution} url={layer.url} maxZoom={22} />
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

          {/* Special markers (id >= 1001) */}
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
