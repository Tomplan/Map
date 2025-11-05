import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getLogoPath } from '../utils/getLogoPath';

const BottomSheet = ({ marker, onClose }) => {
  return (
    <AnimatePresence>
      {marker && (
        <>
          <motion.div
            className="bottom-sheet-backdrop"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            className="bottom-sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
          >
            <div className="handle" />
            <div className="content">
              <div className="w-20 h-20 mx-auto mb-3 flex items-center justify-center bg-white rounded-md border border-gray-300 overflow-hidden">
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
              {marker.info && (
                <div className="text-sm text-gray-600 mt-2 pt-2 border-t border-gray-200">
                  {marker.info}
                </div>
              )}
              <button
                onClick={onClose}
                className="mt-4 w-full bg-gray-200 py-2 rounded-md text-gray-700 font-medium hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default BottomSheet;
