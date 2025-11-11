import React from 'react';
import { Tooltip, Popup } from 'react-leaflet';
import BottomSheet from './MobileBottomSheet';
import useIsMobile from '../utils/useIsMobile';
import { getLogoWithFallback } from '../utils/getDefaultLogo';

// --- Tooltip for both cluster + special markers ---
export const MarkerTooltipContent = ({ marker, organizationLogo }) => (
  <div className="flex items-center gap-2 p-1">
    <div className="w-8 h-8 flex items-center justify-center bg-white rounded-sm border border-gray-200 overflow-hidden">
      <img
        src={getLogoWithFallback(marker.logo, organizationLogo)}
        alt=""
        className="max-w-[70%] max-h-[70%] object-contain"
      />
    </div>
    <div className="flex flex-col min-w-0">
      {marker.glyph && (
        <div className="text-xs font-semibold text-gray-700">
          Booth {marker.glyph}
        </div>
      )}
      {marker.name && (
        <div className="text-sm font-medium text-gray-900 truncate">
          {marker.name}
        </div>
      )}
    </div>
  </div>
);

// --- Desktop Popup with scrollable content ---
export const MarkerPopupDesktop = ({ marker, organizationLogo }) => (
  <Popup
    closeButton={true}
    className="marker-popup-scrollable"
    autoPan={true}
    maxWidth={320}
    minWidth={240}
  >
    <div className="popup-scroll-container">
      <div className="popup-scroll-content">
        <div className="w-24 h-24 mx-auto mb-3 flex items-center justify-center bg-white rounded-md border border-gray-300 overflow-hidden flex-shrink-0">
          <img
            src={getLogoWithFallback(marker.logo, organizationLogo)}
            alt={marker.name || 'Logo'}
            className="max-w-[80%] max-h-[80%] object-contain"
          />
        </div>
        <div className="text-base font-semibold text-gray-900 mb-1">{marker.name}</div>
        {marker.glyph && (
          <div className="text-sm text-gray-700 mb-2">
            Booth {marker.glyph}
          </div>
        )}
        {marker.website && (
          <div className="text-sm mb-2">
            <a
              href={
                marker.website.startsWith('http')
                  ? marker.website
                  : `https://${marker.website}`
              }
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
  </Popup>
);

// --- Mobile Popup + Bottom Sheet pair ---
export const MarkerPopupMobile = ({ marker, onMoreInfo, organizationLogo }) => (
  <Popup closeButton={true} className="marker-popup" autoPan={true}>
    <div className="p-2 text-center">
      <div className="w-12 h-12 mx-auto mb-2 flex items-center justify-center bg-white rounded-md border border-gray-300 overflow-hidden">
        <img
          src={getLogoWithFallback(marker.logo, organizationLogo)}
          alt=""
          className="max-w-[80%] max-h-[80%] object-contain"
        />
      </div>
      <div className="font-semibold text-gray-900 text-sm">{marker.name}</div>
      {marker.glyph && (
        <div className="text-xs text-gray-700 mb-2">
          Booth {marker.glyph}
        </div>
      )}
      <button
        onClick={onMoreInfo}
        className="bg-blue-500/90 text-white text-xs px-3 py-1 rounded-full hover:bg-blue-600"
      >
        More Info
      </button>
    </div>
  </Popup>
);

// --- Combined helper ---
export const MarkerUI = ({ marker, onMoreInfo, isMobile, organizationLogo }) => (
  <>
    {!isMobile && (
      <>
        <Tooltip direction="top" offset={[0, -10]} opacity={0.95}>
          <MarkerTooltipContent marker={marker} organizationLogo={organizationLogo} />
        </Tooltip>
        <MarkerPopupDesktop marker={marker} organizationLogo={organizationLogo} />
      </>
    )}
    {isMobile && <MarkerPopupMobile marker={marker} onMoreInfo={onMoreInfo} organizationLogo={organizationLogo} />}
  </>
);