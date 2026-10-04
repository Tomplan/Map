import React, { useState, useEffect } from 'react';
import { Tooltip, Popup } from 'react-leaflet';
import Icon from '@mdi/react';
import { mdiMapMarker } from '@mdi/js';
import { BottomSheetContent } from './MobileBottomSheet';
import useIsMobile from '../hooks/useIsMobile';
import { getLogoWithFallback } from '../utils/getDefaultLogo';
import { useOptionalFavoritesContext } from '../contexts/FavoritesContext';
import FavoriteButton from './FavoriteButton';
import { useTranslatedCompanyInfo } from '../hooks/useTranslatedCompanyInfo';
import { useCategories } from '../hooks/useCategories';
import { useTranslation } from 'react-i18next';
import { mdiOpenInNew } from '@mdi/js';
import getWebsiteLink from '../utils/getWebsiteLink';

// --- Tooltip for both cluster + special markers ---
const MarkerTooltipContent = ({ marker, organizationLogo, showBoothNumber = true }) => {
  const { t } = useTranslation();
  const hasCompanyData = marker.name || marker.companyId;
  const websiteLink = getWebsiteLink(marker.website);

  return (
    <div className="flex max-w-[280px] items-start gap-3 p-2 text-left">
      {hasCompanyData && (
        <div
          className="h-14 w-14 flex-shrink-0 flex items-center justify-center bg-white rounded-md border border-gray-200 overflow-hidden"
          style={{ backgroundColor: marker.logo_background_color || '#ffffff' }}
        >
          <img
            src={getLogoWithFallback(marker.logo, organizationLogo)}
            className="max-w-full max-h-full object-contain p-1"
            alt={marker.name || ''}
          />
        </div>
      )}
      <div className="min-w-0 flex-1">
        {marker.name ? (
          <div className="break-words text-sm font-semibold text-gray-900">{marker.name}</div>
        ) : (
          <div className="text-sm font-semibold italic text-gray-500">
            {t('map.unassigned', 'Unassigned')}
          </div>
        )}
        {showBoothNumber && marker.glyph && (
          <div className="mt-1 flex items-center gap-1 text-xs font-medium text-orange-600">
            <Icon path={mdiMapMarker} size={0.65} />
            {t('map.booth', 'Booth')} {marker.glyph}
          </div>
        )}
        {websiteLink && (
          <div className="mt-1 text-xs">
            <a
              href={websiteLink.href}
              target="_blank"
              rel="noopener noreferrer"
              title={websiteLink.href}
              onClick={(event) => event.stopPropagation()}
              className="inline-flex items-center gap-1 font-medium text-[#0078a8] underline break-all"
            >
              {websiteLink.label}
              <Icon path={mdiOpenInNew} size={0.6} />
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Desktop Popup with scrollable content ---
const MarkerPopupDesktop = ({ marker, organizationLogo, showBoothNumber = true }) => {
  const hasCompanyData = marker.name || marker.companyId;
  const websiteLink = getWebsiteLink(marker.website);
  const favoritesContext = useOptionalFavoritesContext();
  const isFavorite = favoritesContext?.isFavorite || (() => false);
  const toggleFavorite = favoritesContext?.toggleFavorite || (() => {});
  const translatedInfo = useTranslatedCompanyInfo(marker);
  const { t, i18n } = useTranslation();
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
        <div className="popup-scroll-content text-left">
          {hasCompanyData && (
            <div
              className="w-24 h-24 mx-auto mb-3 flex items-center justify-center bg-white rounded-md border border-gray-300 overflow-hidden flex-shrink-0"
              style={{ backgroundColor: marker.logo_background_color || '#ffffff' }}
            >
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
              {t('map.unassignedBooth', 'Unassigned Booth')}
            </div>
          )}
          {showBoothNumber && marker.glyph && (
            <div className="mb-2 flex items-center gap-1 text-sm font-medium text-orange-600">
              <Icon path={mdiMapMarker} size={0.7} />
              {t('map.booth', 'Booth')} {marker.glyph}
            </div>
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
          {websiteLink && (
            <div className="text-sm mb-2">
              <a
                href={websiteLink.href}
                target="_blank"
                rel="noopener noreferrer"
                title={websiteLink.href}
                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 underline break-all"
              >
                {websiteLink.label}
                <Icon path={mdiOpenInNew} size={0.65} />
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
  const { t } = useTranslation();
  const hasCompanyData = marker.name || marker.companyId;
  const websiteLink = getWebsiteLink(marker.website);

  return (
    <Popup closeButton={true} className="marker-popup" autoPan={true}>
      <div className="p-2 text-left">
        <div className="flex items-start gap-3">
          {hasCompanyData && (
            <div
              className="h-16 w-16 flex-shrink-0 flex items-center justify-center bg-white rounded-md border border-gray-300 overflow-hidden"
              style={{ backgroundColor: marker.logo_background_color || '#ffffff' }}
            >
              <img
                src={getLogoWithFallback(marker.logo, organizationLogo)}
                alt={marker.name || ''}
                className="max-w-full max-h-full object-contain p-1"
              />
            </div>
          )}

          <div className="min-w-0 flex-1">
            {marker.name ? (
              <div className="font-semibold text-gray-900 text-sm break-words">{marker.name}</div>
            ) : (
              <div className="font-semibold text-gray-500 italic text-sm">
                {t('map.unassignedBooth', 'Unassigned Booth')}
              </div>
            )}

            {showBoothNumber && marker.glyph && (
              <div className="mt-1 flex items-center gap-1 text-xs font-medium text-orange-600">
                <Icon path={mdiMapMarker} size={0.7} />
                {t('map.booth', 'Booth')} {marker.glyph}
              </div>
            )}

            {websiteLink && (
              <div className="mt-2 text-xs">
                <a
                  href={websiteLink.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={websiteLink.href}
                  onClick={(event) => event.stopPropagation()}
                  className="inline-flex items-center gap-1 font-medium text-[#0078a8] underline break-all"
                >
                  {websiteLink.label}
                  <Icon path={mdiOpenInNew} size={0.6} />
                </a>
              </div>
            )}
          </div>
        </div>

        {hasCompanyData && (
          <button
            onClick={onMoreInfo}
            className="mt-3 w-full rounded-md bg-orange-600 px-3 py-2 text-xs font-semibold text-white hover:bg-orange-700"
          >
            {t('map.moreInfo', 'More Info')}
          </button>
        )}
      </div>
    </Popup>
  );
};

const AdminMarkerPopup = ({ marker }) => (
  <Popup
    closeButton={true}
    className="marker-popup-scrollable"
    autoPan={true}
    maxWidth={360}
    minWidth={280}
  >
    <BottomSheetContent
      marker={marker}
      showCloseButton={false}
      className="max-h-[60vh] overflow-y-auto px-4 pb-4"
    />
  </Popup>
);

// --- Combined helper ---
export const MarkerUI = ({
  marker,
  onMoreInfo,
  isMobile,
  organizationLogo,
  isAdminView = false,
  showBoothNumber = true,
  showTooltip = true, // Default to true if not provided
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
          {showTooltip && hasTooltipContent ? (
            <Tooltip direction="top" offset={[0, -10]} opacity={0.95}>
              <MarkerTooltipContent
                marker={marker}
                organizationLogo={organizationLogo}
                showBoothNumber={showBoothNumber}
              />
            </Tooltip>
          ) : (
            // Always bind a tooltip so Leaflet's _addFocusListenersOnLayer
            // never hits a null _tooltip reference on focus events.
            <Tooltip direction="top" offset={[0, -10]} opacity={0}>
              <span />
            </Tooltip>
          )}
        </>
      )}
      {!isMobile ? (
        isAdminView ? (
          <AdminMarkerPopup marker={marker} />
        ) : (
          <MarkerPopupDesktop
            marker={marker}
            organizationLogo={organizationLogo}
            showBoothNumber={showBoothNumber}
          />
        )
      ) : (
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
