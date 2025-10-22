import React, { useRef, useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.awesome-markers/dist/leaflet.awesome-markers.css';
import 'leaflet.awesome-markers';
import 'leaflet-search/dist/leaflet-search.src.css';
import 'leaflet-search';
import 'leaflet-search/dist/leaflet-search.src.css';
import 'leaflet-search';
import blueIconUrl from '../../assets/icons/glyph-marker-icon-blue.svg';

// Debug: Check if L.AwesomeMarkers is defined
console.log('L.AwesomeMarkers:', L.AwesomeMarkers);


// Fallback to public path if import fails
const resolvedIconUrl = typeof blueIconUrl === 'string' && blueIconUrl.length > 0
  ? blueIconUrl
  : '/assets/icons/glyph-marker-icon-blue.svg';

// Helper to create booth marker with number
function createBoothMarkerIcon(number) {
  return L.AwesomeMarkers.icon({
    icon: 'fa-number', // Placeholder, will be replaced with number
    markerColor: 'blue',
    prefix: 'fa',
    extraClasses: `booth-marker booth-number-${number}`,
  });
}

// Helper to create special marker with mdi glyph
function createSpecialMarkerIcon(mdiIcon) {
  return L.AwesomeMarkers.icon({
    icon: mdiIcon, // e.g., 'mdi-information', 'mdi-star'
    markerColor: 'red',
    prefix: 'mdi',
    extraClasses: 'special-marker',
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

  return (
    <div
      ref={mapRef}
      style={{ height: '400px', width: '100%' }}
      tabIndex={0}
      aria-label="Event Map"
      aria-describedby="event-map-instructions"
      role="region"
    >
      <span id="event-map-instructions" className="sr-only">
        Use Tab to focus the map. Use mouse or touch to pan and zoom. Map controls are not keyboard accessible by default. For assistance, contact event staff.
      </span>
      {isVisible && (
        <MapContainer
          center={DEFAULT_POSITION}
          zoom={DEFAULT_ZOOM}
          minZoom={14}
          maxZoom={21}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
          aria-label="Event Map Container"
          whenReady={() => trackMapInteraction('map_ready')}
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
            } else if (marker.type === 'special' && marker.mdiIcon) {
              icon = createSpecialMarkerIcon(marker.mdiIcon);
            } else {
              icon = L.AwesomeMarkers.icon({
                icon: 'info-sign',
                markerColor: 'blue',
                prefix: 'glyphicon',
                extraClasses: 'default-marker',
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
