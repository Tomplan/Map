import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useMap } from 'react-leaflet';
import { getLogoPath } from '../utils/getLogoPath';
import { BRANDING_CONFIG } from '../config/mapConfig';

const BottomSheet = ({ marker, onClose }) => {
  const map = useMap();

  // Lock map dragging while sheet is open
  useEffect(() => {
    if (map) map.dragging.disable();
    return () => {
      if (map) map.dragging.enable();
    };
  }, [map]);

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
              src={getLogoPath(marker.logo && marker.logo.trim() !== '' ? marker.logo : BRANDING_CONFIG.getDefaultLogoPath())}
              alt={marker.name || 'Logo'}
              className="max-w-[80%] max-h-[80%] object-contain"
            />
          </div>

          {/* Name and Booth */}
          <div className="text-base font-semibold text-gray-900">{marker.name}</div>
          <div className="text-sm text-gray-700 mb-1">Booth {marker.boothNumber}</div>

          {/* Website */}
          {marker.website && (
            <div className="text-sm mb-1">
              <a
                href={marker.website.startsWith('http') ? marker.website : `https://${marker.website}`}
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
            <div className="text-sm text-gray-600 mt-2 pt-2 border-t border-gray-200">{marker.info}</div>
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
    document.body // Render directly to document.body, outside the map container
  );
};

export default BottomSheet;