import { useEffect } from 'react';
import { getLogoPath } from '../utils/getLogoPath';

/**
 * Custom hook to preload marker logo images
 * @param {Array} markers - Array of marker objects
 */
export function useMarkerPreload(markers) {
  useEffect(() => {
    markers.forEach((marker) => {
      if (marker.logo) {
        const img = new window.Image();
        img.src = getLogoPath(marker.logo);
      }
    });
  }, [markers]);
}
