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
}) {
  const isMobile = useIsMobile('md');
  const [selectedMarker, setSelectedMarker] = useState(null);
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
      });
    },
    [isAdminView]
  );

  // Handle assignment
  const handleAssign = useCallback(
    async (markerId, companyId) => {
      setContextMenuLoading(true);
      try {
        await assignCompanyToMarker(markerId, companyId);
      } catch (error) {
        console.error('Error assigning company:', error);
      } finally {
        setContextMenuLoading(false);
      }
    },
    [assignCompanyToMarker]
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
          position={contextMenu.position}
          onClose={() => setContextMenu({ isOpen: false, position: null, marker: null })}
          closeButton={true}
          closeOnClick={false}
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