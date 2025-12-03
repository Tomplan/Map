import { useEffect } from 'react';
import { getLogoPath, getResponsiveLogoSources } from '../utils/getLogoPath';

/**
 * Custom hook to preload marker logo images
 * @param {Array} markers - Array of marker objects
 */
export function useMarkerPreload(markers) {
  useEffect(() => {
    markers.forEach((marker) => {
      if (marker.logo) {
        const img = new window.Image();
        const r = getResponsiveLogoSources(marker.logo);
        if (r && r.src) {
          img.src = r.src;
          if (r.srcSet) img.srcset = r.srcSet;
        } else {
          img.src = getLogoPath(marker.logo);
        }
      }
    });
  }, [markers]);
}
