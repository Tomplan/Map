import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdZoomIn, MdZoomOut, MdHome } from 'react-icons/md';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-search/dist/leaflet-search.src.css';
import 'leaflet-search';
import { createMarkerIcon } from '../utils/markerIcons';
import useEventMarkers from '../hooks/useEventMarkers';
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

function SearchControl({ markers }) {
  const map = useMap();
  // Ensure markers is always an array, memoized for hook compliance
  const safeMarkers = React.useMemo(() => Array.isArray(markers) ? markers : [], [markers]);
  // Use a persistent marker layer for search
  React.useEffect(() => {
    if (!map || !safeMarkers || safeMarkers.length === 0) return;
    if (!map._searchMarkerLayer) {
      map._searchMarkerLayer = L.layerGroup();
      map.addLayer(map._searchMarkerLayer);
    }
    map._searchMarkerLayer.clearLayers();
    safeMarkers.forEach(marker => {
      const markerObj = L.marker([marker.lat, marker.lng], {
        title: marker.label,
        opacity: 0,
        interactive: false
      });
      map._searchMarkerLayer.addLayer(markerObj);
    });
    if (map._searchControl) {
      map.removeControl(map._searchControl);
    }
    const searchControl = new L.Control.Search({
      layer: map._searchMarkerLayer,
      propertyName: 'title',
      moveToLocation: function(latlng, title, map) {
        map.setView(latlng, map.getZoom());
      },
      initial: false,
      zoom: map.getZoom(),
      marker: false,
      textPlaceholder: 'Search for a location...'
    });
    map._searchControl = searchControl;
    map.addControl(searchControl);
    return () => {
      if (map._searchControl) {
        map.removeControl(map._searchControl);
        map._searchControl = null;
      }
      if (map._searchMarkerLayer) {
        map.removeLayer(map._searchMarkerLayer);
        map._searchMarkerLayer = null;
      }
    };
  }, [map, safeMarkers]);
  return null;
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

function EventMap() {
  const { t } = useTranslation();
  // Always use Carto Voyager for user view
  const activeLayer = MAP_LAYERS[0].key;
  const [mapInstance, setMapInstance] = useState(null);
  const DEFAULT_POSITION = [51.898945656392904, 5.779029262641933];
  const DEFAULT_ZOOM = 17; // Default zoom level
  const { markers, loading, isOnline } = useEventMarkers();
  const { trackMarkerView } = useAnalytics();

  // Map config for fullscreen
  const mapCenter = DEFAULT_POSITION;
  const mapZoom = DEFAULT_ZOOM;
  const minZoom = 14;
  const maxZoom = 21;
  const handleMapCreated = (mapOrEvent) => {
    // React-Leaflet v5 passes event, v3/v4 passes map
    if (mapOrEvent && mapOrEvent.target) {
      setMapInstance(mapOrEvent.target);
    } else {
      setMapInstance(mapOrEvent);
    }
  };

  // Log zoom level after change for accurate measurement
  React.useEffect(() => {
    if (!mapInstance) return;
    const logZoom = () => {
      console.log('Zoom changed. Now:', mapInstance.getZoom());
    };
    mapInstance.on('zoomend', logZoom);
    return () => {
      mapInstance.off('zoomend', logZoom);
    };
  }, [mapInstance]);
  // Removed unused handleHome

  // Ensure markers is always an array, memoized for hook compliance
  const safeMarkers = React.useMemo(() => Array.isArray(markers) ? markers : [], [markers]);

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
      {/* Zoom and home controls */}
  <div style={{ position: 'absolute', top: 80, right: 16, zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <button
          onClick={handleZoomIn}
          aria-label="Zoom in"
          className="bg-white rounded-full shadow p-2 mb-2 flex items-center justify-center"
          style={{ width: 44, height: 44 }}
        >
          <MdZoomIn size={28} color="#1976d2" aria-hidden="true" />
          <span className="sr-only">Zoom in</span>
        </button>
        <button
          onClick={handleZoomOut}
          aria-label="Zoom out"
          className="bg-white rounded-full shadow p-2 mb-2 flex items-center justify-center"
          style={{ width: 44, height: 44 }}
        >
          <MdZoomOut size={28} color="#1976d2" aria-hidden="true" />
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
              maxZoom={21}
            />
          ))}
          <SearchControl markers={safeMarkers} />
          {safeMarkers.map(marker => {
            let icon;
            if (marker.type === 'booth-holder' && marker.number) {
              icon = createMarkerIcon({ className: `booth-marker booth-number-${marker.number}` });
            } else if (marker.type === 'special' && marker.svgUrl) {
              icon = createMarkerIcon({ className: 'special-marker' });
            } else {
              icon = createMarkerIcon({ className: 'default-marker' });
            }
            // Tooltip content: logo and name
            const logoPath = marker.logo ? `/assets/logos/${marker.logo}` : null;
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
            return (
              <Marker
                key={marker.id}
                position={[marker.lat, marker.lng]}
                icon={icon}
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

