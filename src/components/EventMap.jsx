import React, { useState } from 'react';
import { MdZoomIn, MdZoomOut, MdHome } from 'react-icons/md';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-search/dist/leaflet-search.src.css';
import 'leaflet-search';
import { createMarkerIcon, createBoothMarkerIcon, createSpecialMarkerIcon } from '../utils/markerIcons';
import orangeIconUrl from '../../assets/icons/glyph-marker-icon-blue.svg';
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
  // Ensure markers is always an array
  const safeMarkers = Array.isArray(markers) ? markers : [];
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
  const [activeLayer, setActiveLayer] = useState(MAP_LAYERS[0].key);
  const [mapInstance, setMapInstance] = useState(null);
  const DEFAULT_POSITION = [51.898945656392904, 5.779029262641933];
  const DEFAULT_ZOOM = 17; // Default zoom level
  // Removed zoom state; use mapInstance.setZoom instead
  const markers = useEventMarkers();
  const { trackMapInteraction, trackMarkerView } = useAnalytics();

  const handleZoomIn = () => {
    if (mapInstance) mapInstance.zoomIn();
  };
  const handleZoomOut = () => {
    if (mapInstance) mapInstance.zoomOut();
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
  const handleHome = () => {
    if (mapInstance) mapInstance.setView(DEFAULT_POSITION, DEFAULT_ZOOM);
  };

  // Ensure markers is always an array, memoized for hook compliance
  const safeMarkers = React.useMemo(() => Array.isArray(markers) ? markers : [], [markers]);

  return (
    <div
      style={{ height: '400px', width: '100%', position: 'relative' }}
      tabIndex={0}
      aria-label="Event Map"
      aria-describedby="event-map-instructions"
      role="region"
    >
      <span id="event-map-instructions" className="sr-only">
        Use Tab to focus the map. Use mouse or touch to pan and zoom. Map controls are not keyboard accessible by default. For assistance, contact event staff.
      </span>
      {/* Floating control panel */}
      <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button aria-label="Zoom in" onClick={handleZoomIn} style={{ background: '#fff', border: 'none', borderRadius: '50%', boxShadow: '0 2px 6px rgba(0,0,0,0.15)', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <span style={{ width: 24, height: 24, minWidth: 24, display: 'inline-block' }}>
            <MdZoomIn style={{ width: '100%', height: '100%', minWidth: 24 }} color="#ff9800" />
          </span>
        </button>
        <button aria-label="Zoom out" onClick={handleZoomOut} style={{ background: '#fff', border: 'none', borderRadius: '50%', boxShadow: '0 2px 6px rgba(0,0,0,0.15)', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <span style={{ width: 24, height: 24, minWidth: 24, display: 'inline-block' }}>
            <MdZoomOut style={{ width: '100%', height: '100%', minWidth: 24 }} color="#ff9800" />
          </span>
        </button>
        <button aria-label="Home" onClick={handleHome} style={{ background: '#fff', border: 'none', borderRadius: '50%', boxShadow: '0 2px 6px rgba(0,0,0,0.15)', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <span style={{ width: 24, height: 24, minWidth: 24, display: 'inline-block' }}>
            <MdHome style={{ width: '100%', height: '100%', minWidth: 24 }} color="#ff9800" />
          </span>
        </button>
        {/* Step 2: Layer selection dropdown */}
        <select
          aria-label="Select map layer"
          value={activeLayer}
          onChange={e => setActiveLayer(e.target.value)}
          style={{ background: '#fff', border: '1px solid #ccc', borderRadius: 6, padding: '6px', fontSize: 14, marginTop: 8 }}
        >
          {MAP_LAYERS.map(layer => (
            <option key={layer.key} value={layer.key}>{layer.name}</option>
          ))}
        </select>
      </div>
      <MapContainer
        center={DEFAULT_POSITION}
        zoom={DEFAULT_ZOOM}
        minZoom={14}
        maxZoom={21}
        zoomDelta={0.5}
        zoomSnap={0.5}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
        zoomControl={false}
        aria-label="Event Map Container"
        whenReady={map => {
          setMapInstance(map.target);
          trackMapInteraction('map_ready');
        }}
        onClick={() => trackMapInteraction('map_click')}
      >
        {/* Step 4: Render only selected layer */}
        {MAP_LAYERS.filter(layer => layer.key === activeLayer).map(layer => (
          <TileLayer
            key={layer.key}
            attribution={layer.attribution}
            url={layer.url}
            maxZoom={21}
          />
        ))}
        <SearchControl markers={markers} />
        {safeMarkers.map(marker => {
          let icon;
          if (marker.type === 'booth-holder' && marker.number) {
            icon = createMarkerIcon({ className: `booth-marker booth-number-${marker.number}` });
          } else if (marker.type === 'special' && marker.svgUrl) {
            icon = createMarkerIcon({ className: 'special-marker' });
          } else {
            icon = createMarkerIcon({ className: 'default-marker' });
          }
          const labelText = getMarkerLabel(marker.label);
          return (
            <Marker
              key={marker.id}
              position={[marker.lat, marker.lng]}
              icon={icon}
            >
              <Popup onOpen={() => trackMarkerView(marker.id)}>{labelText}</Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}

export default EventMap;

