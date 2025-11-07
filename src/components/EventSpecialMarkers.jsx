import React, { useState, useCallback } from 'react';
import { Marker, Tooltip, Popup } from 'react-leaflet';
import { getLogoPath } from '../utils/getLogoPath';
import { getIconPath } from '../utils/getIconPath';
import { createMarkerIcon } from '../utils/markerIcons';
import useIsMobile from '../utils/useIsMobile';
import BottomSheet from './MobileBottomSheet';

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

function EventSpecialMarkers({
  safeMarkers,
  updateMarker,
  isMarkerDraggable,
}) {
  const isMobile = useIsMobile('md');
  const [selectedMarker, setSelectedMarker] = useState(null);

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
              {!isMobile && (
                <Tooltip direction="top" offset={[0, -10]} opacity={0.95}>
                  <MarkerTooltipContent marker={marker} />
                </Tooltip>
              )}

              <Popup closeButton={true} className="marker-popup-scrollable" autoPan={true} maxWidth={320} minWidth={240}>
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
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        e.target.closest('.leaflet-popup-close-button')?.click();
                        setSelectedMarker(marker);
                      }}
                      className="more-info-btn bg-blue-500/90 text-white text-xs px-3 py-1 rounded-full hover:bg-blue-600"
                    >
                      More Info
                    </button>
                  </div>
                ) : (
                  // Desktop popup with scrollable content
                  <div className="popup-scroll-container">
                    <div className="popup-scroll-content">
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
                            style={{ wordBreak: 'break-all' }}
                          >
                            {marker.website}
                          </a>
                        </div>
                      )}
                      {marker.info && (
                        <div 
                          className="text-sm text-gray-600 mt-2 pt-2 border-t border-gray-200"
                          style={{
                            wordWrap: 'break-word',
                            overflowWrap: 'break-word',
                            whiteSpace: 'pre-wrap'
                          }}
                        >
                          {marker.info}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Popup>
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