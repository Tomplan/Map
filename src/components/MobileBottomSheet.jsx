import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '@mdi/react';
import { useMap } from 'react-leaflet';
import { useOrganizationLogo } from '../contexts/OrganizationLogoContext';
import { getLogoWithFallback } from '../utils/getDefaultLogo';
import { useOptionalFavoritesContext } from '../contexts/FavoritesContext';
import FavoriteButton from './FavoriteButton';
import { useCategories } from '../hooks/useCategories';
import { useTranslation } from 'react-i18next';

const BottomSheet = ({ marker, onClose }) => {
  const map = useMap();
  const { organizationLogo } = useOrganizationLogo();
  const favoritesContext = useOptionalFavoritesContext();
  const isFavorite = favoritesContext?.isFavorite || (() => false);
  const toggleFavorite = favoritesContext?.toggleFavorite || (() => {});
  const { i18n } = useTranslation();
  const { getCompanyCategories, categories: allCategories } = useCategories(i18n.language);
  const [categories, setCategories] = useState([]);

  // Lock map dragging while sheet is open
  useEffect(() => {
    if (map) map.dragging.disable();
    return () => {
      if (map) map.dragging.enable();
    };
  }, [map]);

  // Fetch categories when marker.companyId changes
  useEffect(() => {
    if (marker?.companyId) {
      getCompanyCategories(marker.companyId).then(setCategories);
    } else {
      setCategories([]);
    }
  }, [marker?.companyId, getCompanyCategories, allCategories]);

  if (!marker) return null;

  // Render bottom sheet outside the map container using a portal
  return createPortal(
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        className="bottom-sheet-backdrop"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
      />

      {/* Sheet */}
      <motion.div
        key="sheet"
        className="bottom-sheet"
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.25}
        onDragEnd={(event, info) => {
          if (info.offset.y > 100) onClose();
        }}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 180, damping: 22 }}
      >
        <div className="handle" />
        <div className="content">
          {/* Logo */}
          <div className="w-20 h-20 mx-auto mb-3 flex items-center justify-center bg-white rounded-md border border-gray-300 overflow-hidden">
            <img
              src={getLogoWithFallback(marker.logo, organizationLogo)}
              alt={marker.name || 'Logo'}
              className="max-w-[80%] max-h-[80%] object-contain"
            />
          </div>

          {/* Name, Favorite, and Booth */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="text-base font-semibold text-gray-900">{marker.name}</div>
            {marker.companyId && (
              <FavoriteButton
                isFavorite={isFavorite(marker.companyId)}
                onToggle={() => toggleFavorite(marker.companyId)}
                size="md"
              />
            )}
          </div>
          {marker.glyph && <div className="text-sm text-gray-700 mb-1">Booth {marker.glyph}</div>}

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

          {/* Website */}
          {marker.website && (
            <div className="text-sm mb-1">
              <a
                href={
                  marker.website.startsWith('http') ? marker.website : `https://${marker.website}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                {marker.website}
              </a>
            </div>
          )}

          {/* Info */}
          {marker.info && (
            <div className="text-sm text-gray-600 mt-2 pt-2 border-t border-gray-200">
              {marker.info}
            </div>
          )}

          {/* Close button */}
          <button
            onClick={onClose}
            className="mt-4 w-full bg-gray-200 py-2 rounded-md text-gray-700 font-medium hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body, // Render directly to document.body, outside the map container
  );
};

export default BottomSheet;
