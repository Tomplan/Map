import React, { useRef, useCallback, useMemo, useState, memo, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Marker, Popup } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import L from 'leaflet';
import { getIconPath } from '../utils/getIconPath';
import { createMarkerIcon } from '../utils/markerIcons';
import useIsMobile from '../utils/useIsMobile';
import BottomSheet from './MobileBottomSheet';
import { MarkerUI } from './MarkerDetailsUI';
import { useOrganizationLogo } from '../contexts/OrganizationLogoContext';
import { useFavoritesContext } from '../contexts/FavoritesContext';
import MarkerContextMenu from './MarkerContextMenu';
import useEventSubscriptions from '../hooks/useEventSubscriptions';
import useAssignments from '../hooks/useAssignments';
import { useDialog } from '../contexts/DialogContext';
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

const createIcon = (marker, isActive = false, isFavorited = false) => {
  let className = marker.type ? `marker-icon marker-type-${marker.type}` : 'marker-icon';
  if (isActive) className += ' marker-active';
  if (isFavorited) className += ' marker-favorited';

  return createMarkerIcon({
    className,
    prefix: marker.prefix,
    iconUrl: getIconFile(marker),
    iconSize: Array.isArray(marker.iconSize) ? marker.iconSize : DEFAULT_ICON.SIZE,
    glyph: marker.glyph || '',
    glyphColor: marker.glyphColor || DEFAULT_ICON.GLYPH_COLOR,
    glyphSize: marker.glyphSize || DEFAULT_ICON.GLYPH_SIZE,
    glyphAnchor: marker.glyphAnchor || DEFAULT_ICON.GLYPH_ANCHOR,
  });
};




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

function EventClusterMarkers({ safeMarkers, updateMarker, isMarkerDraggable, iconCreateFunction, selectedYear, isAdminView, selectedMarkerId, onMarkerSelect, focusMarkerId, onFocusHandled }) {
  const markerRefs = useRef({});
  const isMobile = useIsMobile('md');
  const [internalSelectedMarker, setInternalSelectedMarker] = useState(null);

  // In admin view with external selection, use selectedMarkerId; otherwise use internal state
  const selectedMarker = isAdminView && selectedMarkerId !== undefined
    ? safeMarkers.find(m => m.id === selectedMarkerId)
    : internalSelectedMarker;

  const setSelectedMarker = isAdminView && onMarkerSelect
    ? (marker) => onMarkerSelect(marker ? marker.id : null)
    : setInternalSelectedMarker;
  const { organizationLogo, loading: logoLoading } = useOrganizationLogo();

  // Favorites context (only available in visitor view)
  let favoritesContext = null;
  try {
    favoritesContext = useFavoritesContext();
  } catch (e) {
    // Context not available in admin view, ignore
  }
  const isFavorite = favoritesContext?.isFavorite || (() => false);

  // Context menu state
  const [contextMenu, setContextMenu] = useState({
    isOpen: false,
    position: null,
    marker: null,
  });
  const [contextMenuLoading, setContextMenuLoading] = useState(false);

  // Load subscriptions and assignments (only when in admin view and year is provided)
  const { subscriptions } = useEventSubscriptions(selectedYear || new Date().getFullYear());
  const { assignments, assignCompanyToMarker, unassignCompanyFromMarker } = useAssignments(selectedYear || new Date().getFullYear());

  // Dialog context for confirmations
  const { confirm } = useDialog();

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

  // Handle context menu open
  const handleContextMenu = useCallback(
    (marker) => (e) => {
      if (!isAdminView) return; // Only show in admin view
      L.DomEvent.preventDefault(e); // Prevent default browser context menu
      setContextMenu({
        isOpen: true,
        position: e.latlng,
        marker: marker,
        timestamp: Date.now(), // Force React to recognize as new state
      });
    },
    [isAdminView]
  );

  // Handle assignment
  const handleAssign = useCallback(
    async (markerId, companyId) => {
      // Check if marker already has assignments
      const existingAssignments = assignments.filter(a => a.marker_id === markerId);

      if (existingAssignments.length > 0) {
        // Get company name being assigned
        const newCompany = subscriptions.find(s => s.company_id === companyId)?.company;
        const newCompanyName = newCompany?.name || 'this company';

        // Get booth number/glyph from marker
        const marker = safeMarkers.find(m => m.id === markerId);
        const boothLabel = marker?.glyph || marker?.id || 'this booth';

        // Build warning message
        let warningMessage;
        if (existingAssignments.length === 1) {
          const existingCompanyName = existingAssignments[0].company?.name || 'another company';
          warningMessage = `Booth ${boothLabel} is already assigned to ${existingCompanyName}.\n\nAssign ${newCompanyName} as an additional company for this booth?`;
        } else {
          const companyNames = existingAssignments
            .map(a => a.company?.name)
            .filter(Boolean)
            .join(', ');
          warningMessage = `Booth ${boothLabel} is already assigned to ${existingAssignments.length} companies: ${companyNames}.\n\nAssign ${newCompanyName} as another company for this booth?`;
        }

        // Show confirmation
        const confirmed = await confirm({
          title: 'Multiple Assignments',
          message: warningMessage,
          confirmText: 'Assign',
          variant: 'warning',
        });
        if (!confirmed) {
          return; // User cancelled
        }
      }

      setContextMenuLoading(true);
      try {
        await assignCompanyToMarker(markerId, companyId);
      } catch (error) {
        console.error('Error assigning company:', error);
      } finally {
        setContextMenuLoading(false);
      }
    },
    [assignCompanyToMarker, assignments, subscriptions, safeMarkers]
  );

  // Handle unassignment
  const handleUnassign = useCallback(
    async (markerId, companyId) => {
      setContextMenuLoading(true);
      try {
        await unassignCompanyFromMarker(markerId, companyId);
      } catch (error) {
        console.error('Error unassigning company:', error);
      } finally {
        setContextMenuLoading(false);
      }
    },
    [unassignCompanyFromMarker]
  );

  // Memoize event handlers by marker ID to prevent recreation
  const eventHandlersByMarker = useRef({});
  const getEventHandlers = useCallback(
    (marker) => {
      const key = `${marker.id}-${isMarkerDraggable ? 'draggable' : 'static'}-${isAdminView ? 'admin' : 'visitor'}`;
      if (!eventHandlersByMarker.current[key]) {
        const handlers = {
          popupopen: (e) => e.target.closeTooltip(),
        };
        
        // Only add handlers if they are defined
        if (isMarkerDraggable) {
          handlers.dragend = handleDragEnd(marker.id);
        }
        if (isAdminView) {
          handlers.contextmenu = handleContextMenu(marker);
        }
        
        eventHandlersByMarker.current[key] = handlers;
      }
      return eventHandlersByMarker.current[key];
    },
    [isMarkerDraggable, handleDragEnd, isAdminView, handleContextMenu]
  );

  // Memoize icons by marker visual properties to prevent recreation
  const iconsByMarker = useRef({});
  const getIcon = useCallback((marker, isSelected) => {
    const markerIsFavorited = marker.companyId ? isFavorite(marker.companyId) : false;
    const key = `${marker.id}-${marker.iconUrl || ''}-${marker.glyph || ''}-${marker.glyphColor || ''}-${isSelected}-${markerIsFavorited}`;
    if (!iconsByMarker.current[key]) {
      iconsByMarker.current[key] = createIcon(marker, isSelected, markerIsFavorited);
    }
    return iconsByMarker.current[key];
  }, [isFavorite]);

  // Clean up stale cache entries when markers change to prevent memory leaks
  useEffect(() => {
    const currentMarkerIds = new Set(filteredMarkers.map(m => m.id));

    // Clean up event handlers cache
    Object.keys(eventHandlersByMarker.current).forEach(key => {
      const markerId = parseInt(key.split('-')[0], 10);
      if (!currentMarkerIds.has(markerId)) {
        delete eventHandlersByMarker.current[key];
      }
    });

    // Clean up icons cache
    Object.keys(iconsByMarker.current).forEach(key => {
      const markerId = parseInt(key.split('-')[0], 10);
      if (!currentMarkerIds.has(markerId)) {
        delete iconsByMarker.current[key];
      }
    });
  }, [filteredMarkers]);

  // Handle focus from URL parameter (e.g., from Exhibitor List)
  useEffect(() => {
    if (!focusMarkerId) return;

    // Wait for marker ref to be available
    const checkAndOpenPopup = () => {
      const markerRef = markerRefs.current[focusMarkerId];
      if (markerRef?.current) {
        // For mobile, show bottom sheet instead of popup
        if (isMobile) {
          const marker = filteredMarkers.find(m => m.id === focusMarkerId);
          if (marker) {
            setInternalSelectedMarker(marker);
          }
        } else {
          // For desktop, open the popup
          markerRef.current.openPopup();
        }
        // Clear focus after handling
        if (onFocusHandled) {
          onFocusHandled();
        }
      }
    };

    // Small delay to ensure marker is rendered after flyTo animation
    const timeout = setTimeout(checkAndOpenPopup, 1200);
    return () => clearTimeout(timeout);
  }, [focusMarkerId, isMobile, filteredMarkers, onFocusHandled]);

  // Don't render clusters until logo is loaded to ensure iconCreateFunction has correct value
  if (logoLoading) {
    return null;
  }

  return (
    <>
      <MarkerClusterGroup
        key="cluster-group"
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
              eventHandlers={getEventHandlers(marker)}
              markerRef={getMarkerRef(marker.id)}
              isMobile={isMobile}
              organizationLogo={organizationLogo}
              onMarkerSelect={setSelectedMarker}
            />
          );
        })}
      </MarkerClusterGroup>

      {/* Context Menu - render outside cluster group at map level */}
      {contextMenu.isOpen && contextMenu.marker && (
        <Popup
          key={`context-${contextMenu.marker.id}-${contextMenu.timestamp || Date.now()}`}
          position={contextMenu.position}
          onClose={() => setContextMenu({ isOpen: false, position: null, marker: null })}
          closeButton={true}
          closeOnClick={true}
          closeOnEscapeKey={true}
          autoClose={false}
          maxWidth={300}
          minWidth={250}
        >
          <MarkerContextMenu
            marker={contextMenu.marker}
            subscriptions={subscriptions}
            assignments={assignments}
            onAssign={handleAssign}
            onUnassign={handleUnassign}
            isLoading={contextMenuLoading}
            onClose={() => setContextMenu({ isOpen: false, position: null, marker: null })}
          />
        </Popup>
      )}

      {/* MOBILE Bottom Sheet */}
      {isMobile && selectedMarker && (
        <BottomSheet marker={selectedMarker} onClose={() => setSelectedMarker(null)} />
      )}
    </>
  );
}

EventClusterMarkers.propTypes = {
  safeMarkers: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      lat: PropTypes.number.isRequired,
      lng: PropTypes.number.isRequired,
      type: PropTypes.string,
      iconUrl: PropTypes.string,
      iconSize: PropTypes.arrayOf(PropTypes.number),
      glyph: PropTypes.string,
      glyphColor: PropTypes.string,
      glyphSize: PropTypes.string,
      glyphAnchor: PropTypes.arrayOf(PropTypes.number),
      prefix: PropTypes.string,
      name: PropTypes.string,
      logo: PropTypes.string,
      website: PropTypes.string,
      info: PropTypes.string,
      companyId: PropTypes.number,
    })
  ).isRequired,
  updateMarker: PropTypes.func.isRequired,
  isMarkerDraggable: PropTypes.func.isRequired,
  iconCreateFunction: PropTypes.func.isRequired,
  selectedYear: PropTypes.number,
  isAdminView: PropTypes.bool,
  selectedMarkerId: PropTypes.number,
  onMarkerSelect: PropTypes.func,
  focusMarkerId: PropTypes.number,
  onFocusHandled: PropTypes.func,
};

EventClusterMarkers.defaultProps = {
  selectedYear: new Date().getFullYear(),
  isAdminView: false,
  selectedMarkerId: null,
  onMarkerSelect: null,
  focusMarkerId: null,
  onFocusHandled: null,
};

export default EventClusterMarkers;
