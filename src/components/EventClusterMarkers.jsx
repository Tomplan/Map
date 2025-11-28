import React, { useRef, useCallback, useMemo, useState, memo, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Marker, Popup } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import L from 'leaflet';
import { getIconPath } from '../utils/getIconPath';
import { createMarkerIcon } from '../utils/markerIcons';
import { getIconSizeForZoom, getZoomBucket } from '../utils/markerSizing';
import { normalizeIconSize } from '../utils/iconSizeHelpers';
import useIsMobile from '../hooks/useIsMobile';
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
  DISABLE_CLUSTERING_AT_ZOOM: 17,
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

const getIconFile = (marker, isFavorited = false) => {
  // If favorited, always use yellow marker
  if (isFavorited) {
    return getIconPath('glyph-marker-icon-yellow.svg');
  }
  // Otherwise use custom iconUrl or type-based icon
  return marker.iconUrl ? getIconPath(marker.iconUrl) : getIconPath(`${marker.type || 'default'}.svg`);
};

const createIcon = (marker, isActive = false, isFavorited = false, currentZoom = 17, isAdminView = false) => {
  let className = marker.type ? `marker-icon marker-type-${marker.type}` : 'marker-icon';
  if (isActive) className += ' marker-active';
  if (isFavorited) className += ' marker-favorited';

  // Use marker.iconSize as the single source of truth for base sizes; fall back to default
  // Ensure iconSize is normalized - if height missing derive it from width
  const baseSize = normalizeIconSize(Array.isArray(marker.iconSize) ? marker.iconSize : DEFAULT_ICON.SIZE, DEFAULT_ICON.SIZE);

  // Calculate size based on zoom (disabled in admin view)
  const iconSize = getIconSizeForZoom(currentZoom, baseSize, false, isAdminView);

  return createMarkerIcon({
    className,
    prefix: marker.prefix,
    iconUrl: getIconFile(marker, isFavorited),
    iconSize,
    glyph: marker.glyph || '',
    glyphColor: marker.glyphColor || DEFAULT_ICON.GLYPH_COLOR,
    // If glyphSize explicitly configured on marker, use it. Otherwise compute as a proportion
    // of the final icon height (no glyphBaseSize usage — glyphSize is the single source of truth).
    glyphSize: (() => {
      // If glyphSize explicitly configured on marker, treat it as a base pixel size
      // and scale it proportionally based on current icon height vs marker's stored iconSize.
      if (marker.glyphSize) {
        // parse numeric px value
        let baseGlyphPx = null;
        if (typeof marker.glyphSize === 'number') baseGlyphPx = marker.glyphSize;
        else if (typeof marker.glyphSize === 'string') baseGlyphPx = parseFloat(marker.glyphSize.replace(/[^0-9.-]/g, ''));

        // Determine marker's stored base icon height
        const markerBaseSize = normalizeIconSize(Array.isArray(marker.iconSize) ? marker.iconSize : DEFAULT_ICON.SIZE, DEFAULT_ICON.SIZE);
        const baseIconHeight = markerBaseSize && markerBaseSize[1] ? markerBaseSize[1] : DEFAULT_ICON.SIZE[1];

        if (baseGlyphPx && baseIconHeight) {
          const scaled = (iconSize[1] * baseGlyphPx) / baseIconHeight;
          return `${scaled.toFixed(2)}px`;
        }

        // If parsing fails, fall back to returning provided glyphSize string (normalize to 2 decimals when possible)
        if (typeof marker.glyphSize === 'number') return `${marker.glyphSize.toFixed(2)}px`;
        if (typeof marker.glyphSize === 'string') {
          const parsed = parseFloat(marker.glyphSize.replace(/[^0-9.-]/g, ''));
          return Number.isFinite(parsed) ? `${parsed.toFixed(2)}px` : marker.glyphSize;
        }
        return '';
      }

      // fallback proportion of the final icon height if glyphSize not provided
      return `${Math.round(iconSize[1] * 0.33)}px`;
    })(),
    glyphAnchor: (() => {
      // Scale glyphAnchor (x,y) proportional to marker's stored iconSize -> current iconSize.
      const baseMarkerSize = normalizeIconSize(Array.isArray(marker.iconSize) ? marker.iconSize : DEFAULT_ICON.SIZE, DEFAULT_ICON.SIZE);
      const baseW = baseMarkerSize[0] || DEFAULT_ICON.SIZE[0];
      const baseH = baseMarkerSize[1] || DEFAULT_ICON.SIZE[1];

      const scaleX = baseW ? iconSize[0] / baseW : 1;
      const scaleY = baseH ? iconSize[1] / baseH : 1;

      if (Array.isArray(marker.glyphAnchor) && marker.glyphAnchor.length >= 2) {
        const ax = parseFloat(marker.glyphAnchor[0]) || 0;
        const ay = parseFloat(marker.glyphAnchor[1]) || 0;
        return [parseFloat((ax * scaleX).toFixed(2)), parseFloat((ay * scaleY).toFixed(2))];
      }

      // default anchor scales with current icon size proportionally
      return [parseFloat((DEFAULT_ICON.GLYPH_ANCHOR[0] * scaleX).toFixed(2)), parseFloat((DEFAULT_ICON.GLYPH_ANCHOR[1] * scaleY).toFixed(2))];
    })(),
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

function EventClusterMarkers({ safeMarkers, updateMarker, isMarkerDraggable, iconCreateFunction, selectedYear, isAdminView, selectedMarkerId, onMarkerSelect, focusMarkerId, onFocusHandled, currentZoom, zoomAnimating = null, applyVisitorSizing = false }) {
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
    const zoomBucket = getZoomBucket(currentZoom);
    const effectiveAdminSizing = isAdminView && !applyVisitorSizing;
    const key = `${marker.id}-${marker.iconUrl || ''}-${marker.glyph || ''}-${marker.glyphColor || ''}-${isSelected}-${markerIsFavorited}-${zoomBucket}-${JSON.stringify(marker.iconSize||DEFAULT_ICON.SIZE)}-${marker.glyphSize}-${effectiveAdminSizing}`;
    if (!iconsByMarker.current[key]) {
      iconsByMarker.current[key] = createIcon(marker, isSelected, markerIsFavorited, currentZoom, effectiveAdminSizing);
    }
    return iconsByMarker.current[key];
  }, [isFavorite, currentZoom, isAdminView, applyVisitorSizing]);

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
        // Open popup (small popup on both mobile and desktop)
        markerRef.current.openPopup();
        
        // Clear focus after handling
        if (onFocusHandled) {
          onFocusHandled();
        }
      }
    };

    // Small delay to ensure marker is rendered after flyTo animation
    const timeout = setTimeout(checkAndOpenPopup, 1200);
    return () => clearTimeout(timeout);
  }, [focusMarkerId, filteredMarkers, onFocusHandled]);

  // Prefer reading runtime settings when available (window.MAP_CONFIG); fallback to local defaults
  const runtimeMapConfig = (typeof window !== 'undefined' && window.MAP_CONFIG) || null;
  const MAP_CONFIG = runtimeMapConfig || { MARKER_SIZING: { SMOOTH_ANIMATION: true, SMOOTH_TRANSFORM_MARKER_THRESHOLD: 2000 } };

  // Smooth zoom animation transforms: apply temporary CSS scaling to marker DOM nodes
  useEffect(() => {
    // Performance guard: if not enabled or too many markers, avoid transforms
    const config = MAP_CONFIG || null;
    const smoothingEnabled = config?.MARKER_SIZING?.SMOOTH_ANIMATION !== false;
    const threshold = config?.MARKER_SIZING?.SMOOTH_TRANSFORM_MARKER_THRESHOLD || 0;

    if (!smoothingEnabled) return;
    if (threshold > 0 && filteredMarkers.length > threshold) {
      // too many markers — keep transforms off for performance
      return;
    }

    if (!zoomAnimating) {
      // Clear any transforms applied during animation
      Object.values(markerRefs.current).forEach((ref) => {
        try {
          const markerInstance = ref?.current;
          const el = markerInstance?._icon;
          if (el && el.style) {
            el.style.transform = '';
            el.style.transformOrigin = '';
          }
        } catch (err) {
          // ignore
        }
      });
      return;
    }

    // Apply transform scaling to each marker based on its icon sizes at currentZoom and zoomAnimating
    Object.keys(markerRefs.current).forEach((key) => {
      try {
        const id = parseInt(key, 10);
        const marker = filteredMarkers.find((m) => m.id === id);
        if (!marker) return;
        const ref = markerRefs.current[key];
        const markerInstance = ref?.current;
        const el = markerInstance?._icon;
        if (!el) return;

        // Compute sizes for the committed zoom and current anim zoom
        const baseSize = normalizeIconSize(Array.isArray(marker.iconSize) ? marker.iconSize : DEFAULT_ICON.SIZE, DEFAULT_ICON.SIZE);
        const committed = getIconSizeForZoom(currentZoom, baseSize, false, isAdminView);
        const animSize = getIconSizeForZoom(zoomAnimating, baseSize, false, isAdminView);

        const committedW = committed && committed[0] ? committed[0] : 1;
        const animW = animSize && animSize[0] ? animSize[0] : committedW;
        const scale = committedW > 0 ? animW / committedW : 1;

        // Ensure transform-origin centered at bottom so marker anchors stay in place
        el.style.transformOrigin = '50% 100%';
        // Leaflet default icons use translate to position; include typical translate to avoid layout shift
        el.style.transform = `translate(-50%, -100%) scale(${scale})`;
      } catch (err) {
        // ignore individual marker failures
      }
    });

    // No cleanup necessary; transforms cleared on next zoomAnimating update or zoomend
  }, [zoomAnimating, filteredMarkers, currentZoom, isAdminView]);

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
      glyphSize: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
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
  currentZoom: PropTypes.number,
  applyVisitorSizing: PropTypes.bool,
};

EventClusterMarkers.defaultProps = {
  selectedYear: new Date().getFullYear(),
  isAdminView: false,
  selectedMarkerId: null,
  onMarkerSelect: null,
  focusMarkerId: null,
  onFocusHandled: null,
  currentZoom: 17,
  applyVisitorSizing: false,
};

export default EventClusterMarkers;
