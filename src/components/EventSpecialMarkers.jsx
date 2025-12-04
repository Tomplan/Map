import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { getIconPath } from '../utils/getIconPath';
import { createMarkerIcon } from '../utils/markerIcons';
import { getIconSizeForZoom } from '../utils/markerSizing';
import { normalizeIconSize } from '../utils/iconSizeHelpers';
import useIsMobile from '../hooks/useIsMobile';
import BottomSheet from './MobileBottomSheet';
import { MarkerUI } from './MarkerDetailsUI';
import { useOrganizationLogo } from '../contexts/OrganizationLogoContext';
import MarkerContextMenu from './MarkerContextMenu';
import useEventSubscriptions from '../hooks/useEventSubscriptions';
import useAssignments from '../hooks/useAssignments';
import { useDialog } from '../contexts/DialogContext';

function EventSpecialMarkers({
  safeMarkers,
  updateMarker,
  isMarkerDraggable,
  selectedYear,
  isAdminView,
  selectedMarkerId,
  onMarkerSelect,
  currentZoom,
  applyVisitorSizing = false,
  onMarkerDrag = null,
}) {
  const isMobile = useIsMobile('md');
  const [internalSelectedMarker, setInternalSelectedMarker] = useState(null);

  // In admin view with external selection, use selectedMarkerId; otherwise use internal state
  const selectedMarker =
    isAdminView && selectedMarkerId !== undefined
      ? safeMarkers.find((m) => m.id === selectedMarkerId)
      : internalSelectedMarker;

  const setSelectedMarker =
    isAdminView && onMarkerSelect
      ? (marker) => onMarkerSelect(marker ? marker.id : null)
      : setInternalSelectedMarker;
  const { organizationLogo } = useOrganizationLogo();

  // Context menu state
  const [contextMenu, setContextMenu] = useState({
    isOpen: false,
    position: null,
    marker: null,
  });
  const [contextMenuLoading, setContextMenuLoading] = useState(false);

  // Load subscriptions and assignments (only when in admin view and year is provided)
  const { subscriptions } = useEventSubscriptions(selectedYear || new Date().getFullYear());
  const { assignments, assignCompanyToMarker, unassignCompanyFromMarker } = useAssignments(
    selectedYear || new Date().getFullYear(),
  );

  // Dialog context for confirmations
  const { confirm } = useDialog();

  const handleDragEnd = useCallback(
    (markerId) => (e) => {
      const { lat, lng } = e.target.getLatLng();
      updateMarker(markerId, { lat, lng });
      // Also call onMarkerDrag callback for real-time updates (e.g., in edit mode)
      if (onMarkerDrag) {
        onMarkerDrag(markerId, lat, lng);
      }
    },
    [updateMarker, onMarkerDrag],
  );

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
    [isAdminView],
  );

  // Handle assignment
  const handleAssign = useCallback(
    async (markerId, companyId) => {
      // Check if marker already has assignments
      const existingAssignments = assignments.filter((a) => a.marker_id === markerId);

      if (existingAssignments.length > 0) {
        // Get company name being assigned
        const newCompany = subscriptions.find((s) => s.company_id === companyId)?.company;
        const newCompanyName = newCompany?.name || 'this company';

        // Get booth number/glyph from marker
        const marker = safeMarkers.find((m) => m.id === markerId);
        const boothLabel = marker?.glyph || marker?.id || 'this booth';

        // Build warning message
        let warningMessage;
        if (existingAssignments.length === 1) {
          const existingCompanyName = existingAssignments[0].company?.name || 'another company';
          warningMessage = `Booth ${boothLabel} is already assigned to ${existingCompanyName}.\n\nAssign ${newCompanyName} as an additional company for this booth?`;
        } else {
          const companyNames = existingAssignments
            .map((a) => a.company?.name)
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
    [assignCompanyToMarker, assignments, subscriptions, safeMarkers, confirm],
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
    [unassignCompanyFromMarker],
  );

  return (
    <>
      {safeMarkers
        .filter((marker) => marker.id >= 1001)
        .map((marker) => {
          const position = [marker.lat, marker.lng];

          // Use marker.iconSize as the single source of truth for base sizes; fall back to sensible default
          // Normalize iconSize: if height is missing, compute from width using sensible default.
          const baseSize = normalizeIconSize(
            Array.isArray(marker.iconSize) ? marker.iconSize : [17, 28],
            [17, 28],
          );
          const effectiveAdminSizing = isAdminView && !applyVisitorSizing;
          const iconSize = getIconSizeForZoom(currentZoom, baseSize, true, effectiveAdminSizing);

          // effectiveAdminSizing is already computed above and used for sizing

          const icon = createMarkerIcon({
            className: marker.type ? `marker-icon marker-type-${marker.type}` : 'marker-icon',
            prefix: marker.prefix,
            iconUrl: getIconPath(marker.iconUrl || `${marker.type || 'default'}.svg`),
            iconSize,
            glyph: marker.glyph || '?',
            glyphColor: marker.glyphColor || 'white',
            glyphSize: (() => {
              // If glyphSize explicitly configured on marker, treat it as a base pixel size
              // and scale it proportionally based on current icon height vs marker's stored iconSize.
              if (marker.glyphSize) {
                let baseGlyphPx = null;
                if (typeof marker.glyphSize === 'number') baseGlyphPx = marker.glyphSize;
                else if (typeof marker.glyphSize === 'string')
                  baseGlyphPx = parseFloat(marker.glyphSize.replace(/[^0-9.-]/g, ''));

                const markerBaseSize = normalizeIconSize(
                  Array.isArray(marker.iconSize) ? marker.iconSize : [17, 28],
                  [17, 28],
                );
                const baseIconHeight = markerBaseSize && markerBaseSize[1] ? markerBaseSize[1] : 28;

                if (baseGlyphPx && baseIconHeight) {
                  const scaled = (iconSize[1] * baseGlyphPx) / baseIconHeight;
                  return `${scaled.toFixed(2)}px`;
                }

                if (typeof marker.glyphSize === 'number') return `${marker.glyphSize.toFixed(2)}px`;
                if (typeof marker.glyphSize === 'string') {
                  const parsed = parseFloat(marker.glyphSize.replace(/[^0-9.-]/g, ''));
                  return Number.isFinite(parsed) ? `${parsed.toFixed(2)}px` : marker.glyphSize;
                }
                return '';
              }

              // fallback proportion of the final icon height if glyphSize not provided
              return `${Math.round(iconSize[1] * 0.36)}px`;
            })(),
            glyphAnchor: (() => {
              const markerBase = normalizeIconSize(
                Array.isArray(marker.iconSize) ? marker.iconSize : [17, 28],
                [17, 28],
              );
              const baseW = markerBase[0] || 17;
              const baseH = markerBase[1] || 28;
              const scaleX = baseW ? iconSize[0] / baseW : 1;
              const scaleY = baseH ? iconSize[1] / baseH : 1;

              if (Array.isArray(marker.glyphAnchor) && marker.glyphAnchor.length >= 2) {
                const ax = parseFloat(marker.glyphAnchor[0]) || 0;
                const ay = parseFloat(marker.glyphAnchor[1]) || 0;
                return [parseFloat((ax * scaleX).toFixed(2)), parseFloat((ay * scaleY).toFixed(2))];
              }

              return [parseFloat((0 * scaleX).toFixed(2)), parseFloat((-5 * scaleY).toFixed(2))];
            })(),
            isActive: selectedMarker?.id === marker.id,
          });

          const isDraggable = isMarkerDraggable(marker);

          const eventHandlers = {
            popupopen: (e) => e.target.closeTooltip(),
            ...(isDraggable && { dragend: handleDragEnd(marker.id) }),
            ...(isAdminView && { contextmenu: handleContextMenu(marker) }),
          };

          return (
            <Marker
              key={marker.id}
              position={position}
              icon={icon}
              draggable={isDraggable}
              eventHandlers={eventHandlers}
            >
              <MarkerUI
                marker={marker}
                isMobile={isMobile}
                organizationLogo={organizationLogo}
                showBoothNumber={false}
                onMoreInfo={() => {
                  setSelectedMarker(marker);
                }}
              />
            </Marker>
          );
        })}

      {/* Context Menu - render outside markers at map level */}
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

      {/* Bottom Sheet for mobile */}
      {isMobile && selectedMarker && (
        <BottomSheet marker={selectedMarker} onClose={() => setSelectedMarker(null)} />
      )}
    </>
  );
}

export default EventSpecialMarkers;

// Add propType for applyVisitorSizing
EventSpecialMarkers.propTypes = {
  safeMarkers: PropTypes.array,
  updateMarker: PropTypes.func,
  isMarkerDraggable: PropTypes.func,
  selectedYear: PropTypes.number,
  isAdminView: PropTypes.bool,
  selectedMarkerId: PropTypes.number,
  onMarkerSelect: PropTypes.func,
  currentZoom: PropTypes.number,
  applyVisitorSizing: PropTypes.bool,
  onMarkerDrag: PropTypes.func,
};

EventSpecialMarkers.defaultProps = {
  applyVisitorSizing: false,
};
