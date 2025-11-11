import { useState, useCallback } from 'react';
import { Marker } from 'react-leaflet';
import { getIconPath } from '../utils/getIconPath';
import { createMarkerIcon } from '../utils/markerIcons';
import useIsMobile from '../utils/useIsMobile';
import BottomSheet from './MobileBottomSheet';
import { MarkerUI } from './MarkerDetailsUI';
import { useOrganizationLogo } from '../contexts/OrganizationLogoContext';

function EventSpecialMarkers({
  safeMarkers,
  updateMarker,
  isMarkerDraggable,
}) {
  const isMobile = useIsMobile('md');
  const [selectedMarker, setSelectedMarker] = useState(null);
  const { organizationLogo } = useOrganizationLogo();

  const handleDragEnd = useCallback(
    (markerId) => (e) => {
      const { lat, lng } = e.target.getLatLng();
      updateMarker(markerId, { lat, lng });
    },
    [updateMarker]
  );

  return (
    <>
      {safeMarkers
        .filter((marker) => marker.id >= 1001)
        .map((marker) => {
          const position = [marker.lat, marker.lng];
          const icon = createMarkerIcon({
            className: marker.type ? `marker-icon marker-type-${marker.type}` : 'marker-icon',
            prefix: marker.prefix,
            iconUrl: getIconPath(marker.iconUrl || `${marker.type || 'default'}.svg`),
            iconSize: Array.isArray(marker.iconSize) ? marker.iconSize : [17, 28],
            glyph: marker.glyph || '?',
            glyphColor: marker.glyphColor || 'white',
            glyphSize: marker.glyphSize || '12px',
            glyphAnchor: marker.glyphAnchor || [0, -5],
            isActive: selectedMarker?.id === marker.id,
          });

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
                      dragend: handleDragEnd(marker.id),
                      popupopen: (e) => e.target.closeTooltip(),
                    }
                  : {
                      popupopen: (e) => e.target.closeTooltip(),
                    }
              }
            >
              <MarkerUI
                marker={marker}
                isMobile={isMobile}
                organizationLogo={organizationLogo}
                onMoreInfo={() => {
                  setSelectedMarker(marker);
                }}
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