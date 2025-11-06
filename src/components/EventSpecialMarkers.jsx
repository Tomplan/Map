import React, { useState } from 'react';
import { Marker } from 'react-leaflet';
import { getIconPath } from '../utils/getIconPath';
import { createMarkerIcon } from '../utils/markerIcons';
import { MarkerUI } from './MarkerDetailsUI';
import useIsMobile from '../utils/useIsMobile';
import BottomSheet from './MobileBottomSheet';

function EventSpecialMarkers({
  safeMarkers,
  updateMarker,
  isMarkerDraggable,
}) {
  const isMobile = useIsMobile('md');
  const [selectedMarker, setSelectedMarker] = useState(null);

  return (
    <>
      {safeMarkers
        .filter((marker) => marker.id >= 1001)
        .map((marker) => {
          const position = [marker.lat, marker.lng];
          const icon = createMarkerIcon({ className: marker.type ? `marker-icon marker-type-${marker.type}` : 'marker-icon', prefix: marker.prefix, iconUrl: getIconPath(marker.iconUrl || `${marker.type || 'default'}.svg`), iconSize: Array.isArray(marker.iconSize) ? marker.iconSize : [17, 28], glyph: marker.glyph || '?', glyphColor: marker.glyphColor || 'white', glyphSize: marker.glyphSize || '12px', glyphAnchor: marker.glyphAnchor || [0, -5], });

          const isDraggable = isMarkerDraggable(marker);

          return (
            <Marker
              key={marker.id}
              position={position}
              icon={icon}
              draggable={isDraggable}
              eventHandlers={
                isDraggable
                  ? {
                      dragend: (e) => {
                        const { lat, lng } = e.target.getLatLng();
                        updateMarker(marker.id, { lat, lng });
                      },
                    }
                  : undefined
              }
            >
              <MarkerUI
                marker={marker}
                onMoreInfo={() => setSelectedMarker(marker)}
                isMobile={isMobile}
              />
            </Marker>
          );
        })}

      {/* Bottom Sheet for mobile */}
      {isMobile && selectedMarker && (
        <BottomSheet marker={selectedMarker} onClose={() => setSelectedMarker(null)} />
      )}
    </>
  );
}

export default EventSpecialMarkers;
