import React from 'react';
import { getLogoPath } from '../utils/getLogoPath';
import { Marker, Tooltip, Popup } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import { getIconPath } from '../utils/getIconPath';
import { createMarkerIcon } from '../utils/markerIcons';
import useIsMobile from '../utils/useIsMobile';

function EventClusterMarkers({
  safeMarkers,
  infoButtonToggled,
  setInfoButtonToggled,
  updateMarker,
  isMarkerDraggable,
  iconCreateFunction,
}) {
  // Create refs for each marker
  const markerRefs = React.useRef({});
  const isMobile = useIsMobile('md'); // follows Tailwind’s md breakpoint

  return (
    <MarkerClusterGroup
      chunkedLoading={true}
      showCoverageOnHover={true}
      spiderfyOnMaxZoom={false}
      removeOutsideVisibleBounds={true}
      disableClusteringAtZoom={18}
      maxClusterRadius={400}
      iconCreateFunction={iconCreateFunction}
    >
      {safeMarkers
        .filter((marker) => marker.id < 1001)
        .map((marker) => {
          const isInfoToggled = infoButtonToggled[marker.id];
          let pos = [marker.lat, marker.lng];
          let iconFile = marker.iconUrl;
          if (!iconFile) {
            iconFile = `${marker.type || 'default'}.svg`;
          }
          iconFile = getIconPath(iconFile);
          const icon = createMarkerIcon({
            className: marker.type ? `marker-icon marker-type-${marker.type}` : 'marker-icon',
            prefix: marker.prefix,
            iconUrl: iconFile,
            iconSize: Array.isArray(marker.iconSize) ? marker.iconSize : [15, 25],
            glyph: marker.glyph || '',
            glyphColor: marker.glyphColor || 'white',
            glyphSize: marker.glyphSize || '9px',
            glyphAnchor: marker.glyphAnchor || [0, -4],
          });
          const logoPath = marker.logo ? getLogoPath(marker.logo) : null;
          const isDraggable = isMarkerDraggable(marker);
          const markerEventHandlers = {
            ...(isDraggable
              ? {
                  dragend: (e) => {
                    const { lat, lng } = e.target.getLatLng();
                    updateMarker(marker.id, { lat, lng });
                  },
                }
              : {}),
          };
          // Assign a ref for this marker
          if (!markerRefs.current[marker.id]) {
            markerRefs.current[marker.id] = React.createRef();
          }
          return (
            <Marker
              key={`${marker.id}-${marker.coreLocked}-${marker.appearanceLocked}-${marker.contentLocked}-${marker.adminLocked}`}
              position={pos}
              icon={icon}
              draggable={isDraggable}
              eventHandlers={markerEventHandlers}
              ref={markerRefs.current[marker.id]}
            >
              {/* Tooltips and popups removed as requested. */}
            </Marker>
          );
        })}
    </MarkerClusterGroup>
  );
}

export default EventClusterMarkers;
