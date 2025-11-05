import React, { useRef, useCallback, useMemo, useState } from 'react';
import { Marker, Tooltip, Popup } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import { getLogoPath } from '../utils/getLogoPath';
import { getIconPath } from '../utils/getIconPath';
import { createMarkerIcon } from '../utils/markerIcons';
import useIsMobile from '../utils/useIsMobile';
import BottomSheet from './MobileBottomSheet'; // NEW
import './MobileBottomSheet.css'; // NEW CSS

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

const getIconFile = (marker) =>
  marker.iconUrl ? getIconPath(marker.iconUrl) : getIconPath(`${marker.type || 'default'}.svg`);

const createIcon = (marker, isActive = false) =>
  createMarkerIcon({
    className: isActive
      ? `${marker.type ? `marker-icon marker-type-${marker.type}` : 'marker-icon'} marker-active`
      : marker.type
      ? `marker-icon marker-type-${marker.type}`
      : 'marker-icon',
    prefix: marker.prefix,
    iconUrl: getIconFile(marker),
    iconSize: Array.isArray(marker.iconSize) ? marker.iconSize : DEFAULT_ICON.SIZE,
    glyph: marker.glyph || '',
    glyphColor: marker.glyphColor || DEFAULT_ICON.GLYPH_COLOR,
    glyphSize: marker.glyphSize || DEFAULT_ICON.GLYPH_SIZE,
    glyphAnchor: marker.glyphAnchor || DEFAULT_ICON.GLYPH_ANCHOR,
  });



  
const getMarkerKey = (marker) =>
  `${marker.id}-${marker.coreLocked}-${marker.appearanceLocked}-${marker.contentLocked}-${marker.adminLocked}`;

const MarkerTooltipContent = ({ marker }) => (
  <div className="flex items-center gap-2 p-1">
    <div className="w-8 h-8 flex items-center justify-center bg-white rounded-sm border border-gray-200 overflow-hidden">
      {marker.logo && (
        <img
          src={getLogoPath(marker.logo)}
          alt=""
          className="max-w-[70%] max-h-[70%] object-contain"
        />
      )}
    </div>
    <div className="flex flex-col min-w-0">
      {marker.boothNumber && (
        <div className="text-xs font-semibold text-gray-700">Booth {marker.boothNumber}</div>
      )}
      {marker.name && <div className="text-sm font-medium text-gray-900 truncate">{marker.name}</div>}
    </div>
  </div>
);

function EventClusterMarkers({ safeMarkers, updateMarker, isMarkerDraggable, iconCreateFunction }) {
  const markerRefs = useRef({});
  const isMobile = useIsMobile('md');
  const [selectedMarker, setSelectedMarker] = useState(null); // NEW STATE

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
      popupopen: (e) => e.target.closeTooltip(),
    }),
    [isMarkerDraggable, handleDragEnd]
  );

  return (
    <>
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
          const icon = createIcon(marker, selectedMarker?.id === marker.id); // pass isActive
          const isDraggable = isMarkerDraggable(marker);
          const markerKey = getMarkerKey(marker);
          

          return (
            <Marker
              key={markerKey}
              position={position}
              icon={icon}
              draggable={isDraggable}
              eventHandlers={getEventHandlers(marker.id)}
              ref={getMarkerRef(marker.id)}
            >
              {!isMobile && (
                <Tooltip direction="top" offset={[0, -10]} opacity={0.95}>
                  <MarkerTooltipContent marker={marker} />
                </Tooltip>
              )}

              <Popup closeButton={true} className="marker-popup" autoPan={true}>
                {isMobile ? (
                  <div className="p-2 text-center">
                    <div className="w-12 h-12 mx-auto mb-2 flex items-center justify-center bg-white rounded-md border border-gray-300 overflow-hidden">
                      {marker.logo && (
                        <img
                          src={getLogoPath(marker.logo)}
                          alt=""
                          className="max-w-[80%] max-h-[80%] object-contain"
                        />
                      )}
                    </div>
                    <div className="font-semibold text-gray-900 text-sm">{marker.name}</div>
                    <div className="text-xs text-gray-700 mb-2">
                      Booth {marker.boothNumber}
                    </div>
                    <button
                      onClick={() => setSelectedMarker(marker)}
                      className="more-info-btn"
                    >
                      More Info
                    </button>
                  </div>
                ) : (
                  // Desktop popup full info
                  <div className="p-2 min-w-[220px]">
                    <div className="w-24 h-24 mx-auto mb-3 flex items-center justify-center bg-white rounded-md border border-gray-300 overflow-hidden">
                      {marker.logo && (
                        <img
                          src={getLogoPath(marker.logo)}
                          alt={marker.name || 'Logo'}
                          className="max-w-[80%] max-h-[80%] object-contain"
                        />
                      )}
                    </div>
                    <div className="text-base font-semibold text-gray-900">{marker.name}</div>
                    <div className="text-sm text-gray-700 mb-1">
                      Booth {marker.boothNumber}
                    </div>
                    {marker.website && (
                      <div className="text-sm">
                        <a
                          href={marker.website.startsWith('http') ? marker.website : `https://${marker.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline"
                        >
                          {marker.website}
                        </a>
                      </div>
                    )}
                    {marker.info && (
                      <div className="text-sm text-gray-600 mt-2 pt-2 border-t border-gray-200">
                        {marker.info}
                      </div>
                    )}
                  </div>
                )}
              </Popup>
            </Marker>
          );
        })}
      </MarkerClusterGroup>

      {/* MOBILE Bottom Sheet */}
      {isMobile && selectedMarker && (
        <BottomSheet marker={selectedMarker} onClose={() => setSelectedMarker(null)} />
      )}
    </>
  );
}

export default EventClusterMarkers;
