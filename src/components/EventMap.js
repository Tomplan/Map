
import React, { useRef, useState } from 'react';
import { MdZoomIn, MdZoomOut, MdHome } from 'react-icons/md';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-search/dist/leaflet-search.src.css';
import 'leaflet-search';
import blueIconUrl from '../../assets/icons/glyph-marker-icon-blue.svg';
import orangeIconUrl from '../../assets/icons/glyph-marker-icon-blue.svg';
import useEventMarkers from '../hooks/useEventMarkers';
import useAnalytics from '../hooks/useAnalytics';
import 'leaflet/dist/leaflet.css';

// Fallback to public path if import fails
const resolvedIconUrl = typeof blueIconUrl === 'string' && blueIconUrl.length > 0
  ? blueIconUrl
  : '/assets/icons/glyph-marker-icon-blue.svg';

// Helper to create booth marker with number
export function createBoothMarkerIcon(number) {
  return L.icon({
    iconUrl: orangeIconUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [0, -41],
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    shadowSize: [41, 41],
    shadowAnchor: [13, 41],
    className: `booth-marker booth-number-${number}`
  });
}

// Helper to create special marker with SVG
export function createSpecialMarkerIcon(svgUrl) {
  return L.icon({
    iconUrl: orangeIconUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [0, -41],
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    shadowSize: [41, 41],
    shadowAnchor: [13, 41],
    className: 'special-marker'
  });
}

function SearchControl({ markers }) {
  const map = useMap();
  React.useEffect(() => {
    if (!map || !markers || markers.length === 0) return;
    // Remove previous search control if exists
    if (map._searchControl) {
      map.removeControl(map._searchControl);
    }
    // Create invisible markers for search layer
    const markerLayer = L.layerGroup(markers.map(marker => {
      const markerObj = L.marker([marker.lat, marker.lng], {
        title: marker.label,
        opacity: 0, // Make marker invisible
        interactive: false // Prevent interaction
      });
      return markerObj;
    }));
    const searchControl = new L.Control.Search({
      layer: markerLayer,
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
    };
  }, [map, markers]);
  return null;
}

function EventMap() {
  const mapRef = useRef(null);
  const [activeLayer, setActiveLayer] = useState('carto');
  const [mapInstance, setMapInstance] = useState(null);
  const DEFAULT_POSITION = [51.898945656392904, 5.779029262641933];
  const DEFAULT_ZOOM = 17;
  const markers = useEventMarkers();
  const { trackMapInteraction, trackMarkerView } = useAnalytics();

  const handleZoomIn = () => {
    if (mapInstance) mapInstance.setZoom(mapInstance.getZoom() + 0.5);
  };
  const handleZoomOut = () => {
    if (mapInstance) mapInstance.setZoom(mapInstance.getZoom() - 0.5);
  };
  const handleHome = () => {
    if (mapInstance) mapInstance.setView(DEFAULT_POSITION, DEFAULT_ZOOM);
  };

  return (
    <div
      ref={mapRef}
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
        <button aria-label="Switch map layer" onClick={() => setActiveLayer(activeLayer === 'carto' ? 'esri' : 'carto')} style={{ background: '#fff', border: 'none', borderRadius: '50%', boxShadow: '0 2px 6px rgba(0,0,0,0.15)', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <span style={{ fontSize: 12, fontWeight: 500 }}>
            {activeLayer === 'carto' ? 'Esri' : 'Carto'}
          </span>
        </button>
      </div>
      {isVisible && (
        <MapContainer
          center={DEFAULT_POSITION}
          zoom={DEFAULT_ZOOM}
          minZoom={14}
          maxZoom={21}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
          zoomControl={false}
          aria-label="Event Map Container"
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
}

