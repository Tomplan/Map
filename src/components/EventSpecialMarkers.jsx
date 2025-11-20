import { useState, useCallback } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { getIconPath } from '../utils/getIconPath';
import { createMarkerIcon } from '../utils/markerIcons';
import useIsMobile from '../utils/useIsMobile';
import BottomSheet from './MobileBottomSheet';
import { MarkerUI } from './MarkerDetailsUI';
import { useOrganizationLogo } from '../contexts/OrganizationLogoContext';
import MarkerContextMenu from './MarkerContextMenu';
import useEventSubscriptions from '../hooks/useEventSubscriptions';
import useAssignments from '../hooks/useAssignments';

function EventSpecialMarkers({
  safeMarkers,
  updateMarker,
  isMarkerDraggable,
  selectedYear,
  isAdminView,
  selectedMarkerId,
  onMarkerSelect,
}) {
  const isMobile = useIsMobile('md');
  const [internalSelectedMarker, setInternalSelectedMarker] = useState(null);

  // In admin view with external selection, use selectedMarkerId; otherwise use internal state
  const selectedMarker = isAdminView && selectedMarkerId !== undefined
    ? safeMarkers.find(m => m.id === selectedMarkerId)
    : internalSelectedMarker;

  const setSelectedMarker = isAdminView && onMarkerSelect
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
  const { assignments, assignCompanyToMarker, unassignCompanyFromMarker } = useAssignments(selectedYear || new Date().getFullYear());

  const handleDragEnd = useCallback(
    (markerId) => (e) => {
      const { lat, lng } = e.target.getLatLng();
      updateMarker(markerId, { lat, lng });
    },
    [updateMarker]
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
        if (!confirm(warningMessage)) {
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