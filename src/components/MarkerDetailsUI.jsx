import React, { useState, useEffect } from 'react';
import { Tooltip, Popup } from 'react-leaflet';
import Icon from '@mdi/react';
import BottomSheet from './MobileBottomSheet';
import useIsMobile from '../hooks/useIsMobile';
import { getLogoWithFallback } from '../utils/getDefaultLogo';
import { useOptionalFavoritesContext } from '../contexts/FavoritesContext';
import FavoriteButton from './FavoriteButton';
import { useTranslatedCompanyInfo } from '../hooks/useTranslatedCompanyInfo';
import { useCategories } from '../hooks/useCategories';
import { useTranslation } from 'react-i18next';

// --- Tooltip for both cluster + special markers ---
const MarkerTooltipContent = ({ marker, organizationLogo, showBoothNumber = true }) => {
  const hasCompanyData = marker.name || marker.companyId;

  return (
    <div className="flex items-center gap-2 p-1">
      {hasCompanyData && (
        <div className="w-8 h-8 flex items-center justify-center bg-white rounded-sm border border-gray-200 overflow-hidden">
          <img
            src={getLogoWithFallback(marker.logo, organizationLogo)}
            className="max-w-[70%] max-h-[70%] object-contain"
            // Use 'logo' as alt text if available, otherwise empty string for decorative
            alt={marker.name || ''}
          />
        </div>
      )}
      <div className="flex flex-col min-w-0">
        {showBoothNumber && marker.glyph && (
          <div className="text-xs font-semibold text-gray-700">Booth {marker.glyph}</div>
        )}
        {marker.name ? (
          <div className="text-sm font-medium text-gray-900 truncate">{marker.name}</div>
        ) : (
          <div className="text-xs font-medium text-gray-500 italic">Unassigned</div>
        )}
      </div>
    </div>
  );
};

// --- Desktop Popup with scrollable content ---
const MarkerPopupDesktop = ({ marker, organizationLogo, showBoothNumber = true }) => {
  const hasCompanyData = marker.name || marker.companyId;
  const favoritesContext = useOptionalFavoritesContext();
  const isFavorite = favoritesContext?.isFavorite || (() => false);
  const toggleFavorite = favoritesContext?.toggleFavorite || (() => {});
  const translatedInfo = useTranslatedCompanyInfo(marker);
  const { i18n } = useTranslation();
  const { getCompanyCategories, categories: allCategories } = useCategories(i18n.language);
  const [categories, setCategories] = useState([]);

  // Fetch categories when marker.companyId changes
  useEffect(() => {
    if (marker.companyId) {
      getCompanyCategories(marker.companyId).then(setCategories);
    } else {
      setCategories([]);
    }
  }, [marker.companyId, getCompanyCategories, allCategories]);

  return (
    <Popup
      closeButton={true}
      className="marker-popup-scrollable"
      autoPan={true}
      maxWidth={320}
      minWidth={240}
    >
      <div className="popup-scroll-container">
        <div className="popup-scroll-content">
          {hasCompanyData && (
            <div className="w-24 h-24 mx-auto mb-3 flex items-center justify-center bg-white rounded-md border border-gray-300 overflow-hidden flex-shrink-0">
              <img
                src={getLogoWithFallback(marker.logo, organizationLogo)}
                alt={marker.name || 'Logo'}
                className="max-w-[80%] max-h-[80%] object-contain"
              />
            </div>
          )}
          {marker.name ? (
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="text-base font-semibold text-gray-900">{marker.name}</div>
              {marker.companyId && (
                <FavoriteButton
                  isFavorite={isFavorite(marker.companyId)}
                  onToggle={() => toggleFavorite(marker.companyId)}
                  size="sm"
                />
              )}
            </div>
          ) : (
            <div className="text-base font-semibold text-gray-500 italic mb-1">
              Unassigned Booth
            </div>
          )}
          {showBoothNumber && marker.glyph && (
            <div className="text-sm text-gray-700 mb-2">Booth {marker.glyph}</div>
          )}
          {/* Category Badges */}
          {categories && categories.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {categories.map((category) => (
                <span
                  key={category.id}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-white rounded"
                  style={{ backgroundColor: category.color }}
                  title={category.name}
                >
                  <Icon path={category.icon} size={0.5} />
                  {category.name}
                </span>
              ))}
            </div>
          )}
          {marker.website && (
            <div className="text-sm mb-2">
              <a
                href={
                  marker.website.startsWith('http') ? marker.website : `https://${marker.website}`
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
          {translatedInfo && (
            <div
              className="text-sm text-gray-600 mt-2 pt-2 border-t border-gray-200"
              style={{
                wordWrap: 'break-word',
                overflowWrap: 'break-word',
                whiteSpace: 'pre-wrap',
              }}
            >
              {translatedInfo}
            </div>
          )}
        </div>
      </div>
    </Popup>
  );
};

// --- Mobile Popup + Bottom Sheet pair ---
const MarkerPopupMobile = ({ marker, onMoreInfo, organizationLogo, showBoothNumber = true }) => {
  const hasCompanyData = marker.name || marker.companyId;

  return (
    <Popup closeButton={true} className="marker-popup" autoPan={true}>
      <div className="p-2 text-center">
        {hasCompanyData && (
          <div className="w-12 h-12 mx-auto mb-2 flex items-center justify-center bg-white rounded-md border border-gray-300 overflow-hidden">
            <img
              src={getLogoWithFallback(marker.logo, organizationLogo)}
              alt=""
              className="max-w-[80%] max-h-[80%] object-contain"
            />
          </div>
        )}
        {marker.name ? (
          <div className="font-semibold text-gray-900 text-sm">{marker.name}</div>
        ) : (
          <div className="font-semibold text-gray-500 italic text-sm">Unassigned Booth</div>
        )}
        {showBoothNumber && marker.glyph && (
          <div className="text-xs text-gray-700 mb-2">Booth {marker.glyph}</div>
        )}
        {hasCompanyData && (
          <button
            onClick={onMoreInfo}
            className="bg-blue-500/90 text-white text-xs px-3 py-1 rounded-full hover:bg-blue-600"
          >
            More Info
          </button>
        )}
      </div>
    </Popup>
  );
};

// --- Combined helper ---
export const MarkerUI = ({
  marker,
  onMoreInfo,
  isMobile,
  organizationLogo,
  showBoothNumber = true,
}) => {
  // Only show tooltip if marker has meaningful content (glyph or name)
  // This prevents showing empty/incomplete tooltips on first hover
  const hasTooltipContent =
    marker &&
    ((marker.glyph !== undefined && marker.glyph !== null && marker.glyph !== '') || marker.name);

  return (
    <>
      {!isMobile && (
        <>
          {hasTooltipContent && (
            <Tooltip direction="top" offset={[0, -10]} opacity={0.95}>
              <MarkerTooltipContent
                marker={marker}
                organizationLogo={organizationLogo}
                showBoothNumber={showBoothNumber}
              />
            </Tooltip>
          )}
          <MarkerPopupDesktop
            marker={marker}
            organizationLogo={organizationLogo}
            showBoothNumber={showBoothNumber}
          />
        </>
      )}
      {isMobile && (
        <MarkerPopupMobile
          marker={marker}
          onMoreInfo={onMoreInfo}
          organizationLogo={organizationLogo}
          showBoothNumber={showBoothNumber}
        />
      )}
    </>
  );
};
