import React, { useRef, useCallback, useMemo, useState, memo } from 'react';
import { Marker } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import { getIconPath } from '../utils/getIconPath';
import { createMarkerIcon } from '../utils/markerIcons';
import useIsMobile from '../utils/useIsMobile';
import BottomSheet from './MobileBottomSheet';
import { MarkerUI } from './MarkerDetailsUI';
import { useOrganizationLogo } from '../contexts/OrganizationLogoContext';
import './MobileBottomSheet.css';

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




// Optimized marker key - only includes properties that affect visual rendering
// Excludes metadata (companyId, assignmentId, name, locks) to prevent unnecessary unmount/remount
const getMarkerKey = (marker) =>
  `${marker.id}-${marker.lat}-${marker.lng}-${marker.iconUrl || ''}-${marker.glyph || ''}`;

// Memoized individual marker component to prevent unnecessary re-renders
const MemoizedMarker = memo(({ marker, isDraggable, icon, eventHandlers, markerRef, isMobile, organizationLogo, onMarkerSelect }) => (
  <Marker
    position={[marker.lat, marker.lng]}
    icon={icon}
    draggable={isDraggable}
    eventHandlers={eventHandlers}
    ref={markerRef}
  >
    <MarkerUI
      marker={marker}
      isMobile={isMobile}
      organizationLogo={organizationLogo}
      onMoreInfo={() => onMarkerSelect(marker)}
    />
  </Marker>
), (prevProps, nextProps) => {
  // Return true to SKIP re-render, false to re-render
  // Check if cached icon is the same object (meaning visual properties haven't changed)
  const iconUnchanged = prevProps.icon === nextProps.icon;
  const draggableUnchanged = prevProps.isDraggable === nextProps.isDraggable;
  const handlersUnchanged = prevProps.eventHandlers === nextProps.eventHandlers;

  // If visual properties unchanged, check if tooltip content needs update
  if (iconUnchanged && draggableUnchanged && handlersUnchanged) {
    // Allow tooltip/popup content to update without remounting marker
    // Check if metadata changed (name, logo, website, info)
    const metadataChanged =
      prevProps.marker.name !== nextProps.marker.name ||
      prevProps.marker.logo !== nextProps.marker.logo ||
      prevProps.marker.website !== nextProps.marker.website ||
      prevProps.marker.info !== nextProps.marker.info;

    // If only metadata changed, allow re-render (return false)
    // If nothing changed, skip re-render (return true)
    return !metadataChanged;
  }

  // Visual properties changed, must re-render
  return false;
});

function EventClusterMarkers({ safeMarkers, updateMarker, isMarkerDraggable, iconCreateFunction }) {
  const markerRefs = useRef({});
  const isMobile = useIsMobile('md');
  const [selectedMarker, setSelectedMarker] = useState(null);
  const { organizationLogo } = useOrganizationLogo();

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

  // Memoize event handlers by marker ID to prevent recreation
  const eventHandlersByMarker = useRef({});
  const getEventHandlers = useCallback(
    (markerId) => {
      const key = `${markerId}-${isMarkerDraggable ? 'draggable' : 'static'}`;
      if (!eventHandlersByMarker.current[key]) {
        eventHandlersByMarker.current[key] = {
          dragend: isMarkerDraggable ? handleDragEnd(markerId) : undefined,
          popupopen: (e) => e.target.closeTooltip(),
        };
      }
      return eventHandlersByMarker.current[key];
    },
    [isMarkerDraggable, handleDragEnd]
  );

  // Memoize icons by marker visual properties to prevent recreation
  const iconsByMarker = useRef({});
  const getIcon = useCallback((marker, isSelected) => {
    const key = `${marker.id}-${marker.iconUrl || ''}-${marker.glyph || ''}-${marker.glyphColor || ''}-${isSelected}`;
    if (!iconsByMarker.current[key]) {
      iconsByMarker.current[key] = createIcon(marker, isSelected);
    }
    return iconsByMarker.current[key];
  }, []);

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
          const isSelected = selectedMarker?.id === marker.id;
          const icon = getIcon(marker, isSelected);
          const isDraggable = isMarkerDraggable(marker);
          const markerKey = getMarkerKey(marker);

          return (
            <MemoizedMarker
              key={markerKey}
              marker={marker}
              isDraggable={isDraggable}
              icon={icon}
              eventHandlers={getEventHandlers(marker.id)}
              markerRef={getMarkerRef(marker.id)}
              isMobile={isMobile}
              organizationLogo={organizationLogo}
              onMarkerSelect={setSelectedMarker}
            />
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
