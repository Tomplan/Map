import React, { useRef, useCallback, useMemo } from 'react';
import { Marker, Tooltip, Popup } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import { getLogoPath } from '../utils/getLogoPath';
import { getIconPath } from '../utils/getIconPath';
import { createMarkerIcon } from '../utils/markerIcons';
import useIsMobile from '../utils/useIsMobile';

const CLUSTER_CONFIG = {
  CHUNKED_LOADING: true,
  SHOW_COVERAGE_ON_HOVER: true,
  SPIDERFY_ON_MAX_ZOOM: false,
  REMOVE_OUTSIDE_VISIBLE_BOUNDS: true,
  DISABLE_CLUSTERING_AT_ZOOM: 18,
  MAX_CLUSTER_RADIUS: 400,
  MAX_MARKER_ID: 1001,
};

const DEFAULT_ICON = {
  FILE: 'default.svg',
  SIZE: [15, 25],
  GLYPH_COLOR: 'white',
  GLYPH_SIZE: '9px',
  GLYPH_ANCHOR: [0, -4],
};

const getIconFile = (marker) => marker.iconUrl ? getIconPath(marker.iconUrl) : getIconPath(`${marker.type || 'default'}.svg`);

const createIcon = (marker) => createMarkerIcon({
  className: marker.type ? `marker-icon marker-type-${marker.type}` : 'marker-icon',
  prefix: marker.prefix,
  iconUrl: getIconFile(marker),
  iconSize: Array.isArray(marker.iconSize) ? marker.iconSize : DEFAULT_ICON.SIZE,
  glyph: marker.glyph || '',
  glyphColor: marker.glyphColor || DEFAULT_ICON.GLYPH_COLOR,
  glyphSize: marker.glyphSize || DEFAULT_ICON.GLYPH_SIZE,
  glyphAnchor: marker.glyphAnchor || DEFAULT_ICON.GLYPH_ANCHOR,
});

const getMarkerKey = (marker) => `${marker.id}-${marker.coreLocked}-${marker.appearanceLocked}-${marker.contentLocked}-${marker.adminLocked}`;

const MarkerTooltipContent = ({ marker }) => (
  <div className="flex items-center gap-2 p-1">
    {marker.logo && <img src={getLogoPath(marker.logo)} alt="" className="w-8 h-8 object-contain flex-shrink-0" />}
    <div className="flex flex-col min-w-0">
      {marker.boothNumber && <div className="text-xs font-semibold text-gray-700">Booth {marker.boothNumber}</div>}
      {marker.name && <div className="text-sm font-medium text-gray-900 truncate">{marker.name}</div>}
    </div>
  </div>
);

const MarkerPopupContent = ({ marker }) => (
  <div className="p-2 min-w-[200px]">
    {marker.logo && <img src={getLogoPath(marker.logo)} alt={marker.name || 'Logo'} className="w-20 h-20 object-contain mx-auto mb-3" />}
    <div className="space-y-2">
      {marker.boothNumber && <div className="text-sm"><span className="font-semibold text-gray-700">Booth:</span> <span className="text-gray-900">{marker.boothNumber}</span></div>}
      {marker.name && <div className="text-base font-semibold text-gray-900">{marker.name}</div>}
      {marker.website && (
        <div className="text-sm">
          <span className="font-semibold text-gray-700">Website:</span>{' '}
          <a href={marker.website.startsWith('http') ? marker.website : `https://${marker.website}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">{marker.website}</a>
        </div>
      )}
      {marker.info && <div className="text-sm text-gray-600 mt-2 pt-2 border-t border-gray-200">{marker.info}</div>}
      {marker.label && !marker.name && <div className="text-sm text-gray-600">{marker.label}</div>}
    </div>
  </div>
);

function EventClusterMarkers({ safeMarkers, updateMarker, isMarkerDraggable, iconCreateFunction }) {
  const markerRefs = useRef({});
  const tapTimestamps = useRef({});
  const isMobile = useIsMobile('md');

  const filteredMarkers = useMemo(
    () => safeMarkers.filter((m) => m.id < CLUSTER_CONFIG.MAX_MARKER_ID),
    [safeMarkers]
  );

  const handleDragEnd = useCallback(
    (markerId) => (e) => {
      const { lat, lng } = e.target.getLatLng();
      updateMarker(markerId, { lat, lng });
    },
    [updateMarker]
  );

  const getMarkerRef = useCallback((markerId) => {
    if (!markerRefs.current[markerId]) markerRefs.current[markerId] = React.createRef();
    return markerRefs.current[markerId];
  }, []);

 const getEventHandlers = useCallback(
  (markerId) => ({
    dragend: isMarkerDraggable ? handleDragEnd(markerId) : undefined,

    // Desktop hover
    mouseover: (e) => { if (!isMobile) e.target.openTooltip(); },
    mouseout: (e) => { if (!isMobile) e.target.closeTooltip(); },

    // Desktop click
    click: (e) => {
      if (!isMobile) {
        const marker = e.target;
        if (marker.isPopupOpen()) marker.closePopup();
        else marker.openPopup();
      }
    },

    // Mobile touch: first tap → tooltip, second tap → popup
    touchstart: (e) => {
      if (!isMobile) return;

      const marker = e.target;
      const now = Date.now();
      const lastTap = tapTimestamps.current[markerId] || 0;
      const delta = now - lastTap;
      tapTimestamps.current[markerId] = now;

      if (delta < 600) {
        // Second tap → popup
        marker.closeTooltip();
        marker.openPopup();
      } else {
        // First tap → tooltip briefly
        if (!marker.isPopupOpen()) {
          marker.openTooltip();
          setTimeout(() => marker.closeTooltip(), 1500);
        }
      }

      // Prevent the synthetic click from firing popup
      marker.__justTouched = true;
      e.originalEvent.preventDefault();
      e.originalEvent.stopPropagation();
    },

    // Prevent synthetic click from opening popup immediately on mobile
    // **This is the single click handler now**:
    click: (e) => {
      const marker = e.target;
      if (isMobile && marker.__justTouched) {
        marker.__justTouched = false;
        return; // ignore synthetic click
      }
    },

    popupopen: (e) => e.target.closeTooltip(),
  }),
  [isMobile, isMarkerDraggable, handleDragEnd]
);



  return (
    <MarkerClusterGroup
      chunkedLoading={CLUSTER_CONFIG.CHUNKED_LOADING}
      showCoverageOnHover={CLUSTER_CONFIG.SHOW_COVERAGE_ON_HOVER}
      spiderfyOnMaxZoom={CLUSTER_CONFIG.SPIDERFY_ON_MAX_ZOOM}
      removeOutsideVisibleBounds={CLUSTER_CONFIG.REMOVE_OUTSIDE_VISIBLE_BOUNDS}
      disableClusteringAtZoom={CLUSTER_CONFIG.DISABLE_CLUSTERING_AT_ZOOM}
      maxClusterRadius={CLUSTER_CONFIG.MAX_CLUSTER_RADIUS}
      iconCreateFunction={iconCreateFunction}
    >
      {filteredMarkers.map((marker) => {
        const position = [marker.lat, marker.lng];
        const icon = createIcon(marker);
        const isDraggable = isMarkerDraggable(marker);

        return (
          <Marker
            key={getMarkerKey(marker)}
            position={position}
            icon={icon}
            draggable={isDraggable}
            eventHandlers={getEventHandlers(marker.id)}
            ref={getMarkerRef(marker.id)}
          >
            <Tooltip
              direction="top"
              offset={[0, -10]}
              opacity={0.95}
              permanent={false}
              interactive={false}
              className="marker-tooltip"
            >
              <MarkerTooltipContent marker={marker} />
            </Tooltip>

            <Popup
              closeButton={true}
              maxWidth={320}
              minWidth={200}
              className="marker-popup"
              autoPan={true}
              keepInView={true}
            >
              <MarkerPopupContent marker={marker} />
            </Popup>
          </Marker>
        );
      })}
    </MarkerClusterGroup>
  );
}

export default EventClusterMarkers;
