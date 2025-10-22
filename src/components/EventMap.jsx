import React, { useRef, useState, useEffect } from 'react';
import { MdZoomIn, MdZoomOut, MdHome } from 'react-icons/md';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-search/dist/leaflet-search.src.css';
import 'leaflet-search';
import blueIconUrl from '../../assets/icons/glyph-marker-icon-blue.svg';

// Orange marker icon
import orangeIconUrl from '../../assets/icons/glyph-marker-icon-blue.svg';


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
import useEventMarkers from '../hooks/useEventMarkers';
import useAnalytics from '../hooks/useAnalytics';
import 'leaflet/dist/leaflet.css';

import { useMap } from 'react-leaflet';

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
    searchControl.addTo(map);
    map._searchControl = searchControl;
    return () => {
      if (map._searchControl) {
        map.removeControl(map._searchControl);
        map._searchControl = null;
      }
    };
  }, [map, markers]);
  return null;
}

const DEFAULT_POSITION = [51.898945656392904, 5.779029262641933];
const DEFAULT_ZOOM = 17;

export default function EventMap() {
  const [mapInstance, setMapInstance] = useState(null);
  const mapRef = useRef(null);
  const searchControlRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const { markers, loading } = useEventMarkers();
  const { trackMarkerView, trackMapInteraction } = useAnalytics();

  useEffect(() => {
    const observer = new window.IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (mapRef.current) {
      observer.observe(mapRef.current);
    }
    return () => observer.disconnect();
  }, []);

  // Floating control panel handlers
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
          whenReady={map => {
            setMapInstance(map.target);
            trackMapInteraction('map_ready');
          }}
          onClick={() => trackMapInteraction('map_click')}
        >
          <TileLayer
            attribution='&copy; <a href="https://carto.com/attributions">Carto</a>'
            url="https://cartodb-basemaps-{s}.global.ssl.fastly.net/rastertiles/voyager/{z}/{x}/{y}.png"
          />
          {!loading && <SearchControl markers={markers} />}
          {!loading && markers.map(marker => {
            let icon;
              if (marker.type === 'booth-holder' && marker.number) {
                icon = createBoothMarkerIcon(marker.number);
              } else if (marker.type === 'special' && marker.svgUrl) {
                icon = createSpecialMarkerIcon(marker.svgUrl);
              } else {
                icon = L.icon({
                  iconUrl: orangeIconUrl,
                  iconSize: [25, 41],
                  iconAnchor: [12, 41],
                  popupAnchor: [0, -41],
                  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
                  shadowSize: [41, 41],
                  shadowAnchor: [13, 41],
                  className: 'default-marker'
                });
              }
            return (
              <Marker
                key={marker.id}
                position={[marker.lat, marker.lng]}
                icon={icon}
              >
                <Popup onOpen={() => trackMarkerView(marker.id)}>{marker.label}</Popup>
              </Marker>
            );
          })}
        </MapContainer>
      )}
    </div>
  );
}
