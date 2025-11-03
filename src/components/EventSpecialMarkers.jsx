import React from 'react';
import { Marker, Tooltip } from 'react-leaflet';
import { getLogoPath } from '../utils/getLogoPath';
import { getIconPath } from '../utils/getIconPath';
import { createMarkerIcon } from '../utils/markerIcons';

function EventSpecialMarkers({
  safeMarkers,
  infoButtonToggled,
  setInfoButtonToggled,
  isMobile,
  updateMarker,
  isMarkerDraggable
}) {
  return (
    <>
      {safeMarkers.filter(marker => marker.id >= 1001).map(marker => {
        const isInfoToggled = infoButtonToggled[marker.id];
        let pos = [marker.lat, marker.lng];
        let iconFile = marker.iconUrl;
        if (!iconFile) {
          iconFile = `${marker.type || 'glyph-marker-icon-blue'}.svg`;
        }
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
        const logoPath = marker.logo ? getLogoPath(marker.logo) : null;
        const isDraggable = isMarkerDraggable(marker);
        const markerEventHandlers = {
          ...(isDraggable ? {
            dragend: (e) => {
              const { lat, lng } = e.target.getLatLng();
              updateMarker(marker.id, { lat, lng });
            }
          } : {})
        };
        return (
          <Marker
            key={`${marker.id}-${marker.coreLocked}-${marker.appearanceLocked}-${marker.contentLocked}-${marker.adminLocked}`}
            position={pos}
            icon={icon}
            draggable={isDraggable}
            eventHandlers={markerEventHandlers}
          >
            <Tooltip direction="top" offset={[0, -32]} opacity={1} permanent={false} interactive={true}>
              <div className="flex flex-col items-center">
                {logoPath && (
                  <img src={logoPath} alt={marker.name || 'Logo'} style={{ maxWidth: 120, maxHeight: 80, objectFit: 'contain', borderRadius: 0 }} />
                )}
                <span style={{ fontWeight: 600, color: '#1976d2' }}>{marker.name}</span>
                {isMobile && (
                  <button
                    className={`mt-2 px-2 py-1 text-xs rounded ${isInfoToggled ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'}`}
                    onClick={() => {
                      setInfoButtonToggled(prev => ({ ...prev, [marker.id]: !prev[marker.id] }));
                    }}
                  >
                    More info
                  </button>
                )}
              </div>
            </Tooltip>
          </Marker>
        );
      })}
    </>
  );
}

export default EventSpecialMarkers;
