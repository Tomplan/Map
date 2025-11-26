import { useMemo } from 'react';
import useOrganizationSettings from './useOrganizationSettings';
import { MAP_CONFIG as FALLBACK_CONFIG, MAP_LAYERS, BRANDING_CONFIG } from '../config/mapConfig';

/**
 * useMapConfig Hook
 *
 * Provides map configuration from organization_settings with fallback to hard-coded defaults.
 * This ensures backward compatibility while allowing database-driven configuration.
 *
 * @returns {Object} Map configuration object
 * @property {Object} MAP_CONFIG - Complete map configuration
 * @property {Array} MAP_LAYERS - Available tile layers
 * @property {Object} BRANDING_CONFIG - Branding configuration
 * @property {boolean} loading - Whether settings are being loaded
 */
export default function useMapConfig() {
  const { settings, loading } = useOrganizationSettings();

  // Merge organization_settings with fallback defaults
  const MAP_CONFIG = useMemo(() => {
    if (!settings) {
      // Use fallback config while loading or if no settings
      return FALLBACK_CONFIG;
    }

    return {
      // Map center from database or fallback
      DEFAULT_POSITION: [
        settings.map_center_lat ?? FALLBACK_CONFIG.DEFAULT_POSITION[0],
        settings.map_center_lng ?? FALLBACK_CONFIG.DEFAULT_POSITION[1],
      ],

      // Zoom levels from database or fallback
      DEFAULT_ZOOM: settings.map_default_zoom ?? FALLBACK_CONFIG.DEFAULT_ZOOM,
      MIN_ZOOM: settings.map_min_zoom ?? FALLBACK_CONFIG.MIN_ZOOM,
      MAX_ZOOM: settings.map_max_zoom ?? FALLBACK_CONFIG.MAX_ZOOM,
      SEARCH_ZOOM: settings.map_search_zoom ?? FALLBACK_CONFIG.SEARCH_ZOOM,

      // These are UI constants, not configurable (keep from fallback)
      ZOOM_DELTA: FALLBACK_CONFIG.ZOOM_DELTA,
      ZOOM_SNAP: FALLBACK_CONFIG.ZOOM_SNAP,
      RECTANGLE_SIZE: FALLBACK_CONFIG.RECTANGLE_SIZE,
      MINIMAP: FALLBACK_CONFIG.MINIMAP,
    };
  }, [settings]);

  return {
    MAP_CONFIG,
    MAP_LAYERS, // Not configurable in organization_settings yet
    BRANDING_CONFIG,
    loading,
  };
}
