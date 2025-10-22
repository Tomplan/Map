import React from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const DEFAULT_POSITION = [51.898945656392904, 5.779029262641933];
const DEFAULT_ZOOM = 17;

export default function EventMap() {
  return (
    <div
      style={{ height: '400px', width: '100%' }}
      tabIndex={0}
      aria-label="Event Map"
      aria-describedby="event-map-instructions"
      role="region"
    >
      <span id="event-map-instructions" className="sr-only">
        Use Tab to focus the map. Use mouse or touch to pan and zoom. Map controls are not keyboard accessible by default. For assistance, contact event staff.
      </span>
      <MapContainer
        center={DEFAULT_POSITION}
        zoom={DEFAULT_ZOOM}
        minZoom={14}
        maxZoom={21}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
        aria-label="Event Map Container"
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/attributions">Carto</a>'
          url="https://cartodb-basemaps-{s}.global.ssl.fastly.net/rastertiles/voyager/{z}/{x}/{y}.png"
        />
      </MapContainer>
    </div>
  );
}
