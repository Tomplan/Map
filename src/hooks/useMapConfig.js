import { useMemo } from 'react';
import useOrganizationSettings from './useOrganizationSettings';
import useEventMapSettings from './useEventMapSettings';
import { MAP_CONFIG as FALLBACK_CONFIG, MAP_LAYERS, BRANDING_CONFIG } from '../config/mapConfig';

/**
 * useMapConfig Hook
 *
 * Provides map configuration from event_map_settings (per year) with fallback to organization_settings (global) and hard-coded defaults.
 * This ensures backward compatibility while allowing year-specific and database-driven configuration.
 *
 * @param {number} selectedYear - The event year to load map config for (optional, uses global if not provided)
 * @returns {Object} Map configuration object
 * @property {Object} MAP_CONFIG - Complete map configuration
 * @property {Array} MAP_LAYERS - Available tile layers
 * @property {Object} BRANDING_CONFIG - Branding configuration
 * @property {boolean} loading - Whether settings are being loaded
 * @property {boolean} usingEventSettings - Whether using event-specific settings
 */
export default function useMapConfig(selectedYear) {
  const { settings: globalSettings, loading: globalLoading } = useOrganizationSettings();
  const { settings: eventSettings, loading: eventLoading } = useEventMapSettings(selectedYear);

  const loading = globalLoading || eventLoading;

  // Merge event settings (if available) with global settings and fallback defaults
  // Priority: Event settings > Global settings > Fallback defaults
  const MAP_CONFIG = useMemo(() => {
    if (globalLoading) {
      // Use fallback config while loading
      return FALLBACK_CONFIG;
    }

    // Determine which settings to use (event-specific takes priority)
    const activeSettings = eventSettings || globalSettings;

    return {
      // Map center from database or fallback
      DEFAULT_POSITION: [
        activeSettings?.map_center_lat ?? FALLBACK_CONFIG.DEFAULT_POSITION[0],
        activeSettings?.map_center_lng ?? FALLBACK_CONFIG.DEFAULT_POSITION[1],
      ],

      // Admin-specific map center (not configurable, use fallback)
      ADMIN_DEFAULT_POSITION: FALLBACK_CONFIG.ADMIN_DEFAULT_POSITION,

      // Zoom levels from database or fallback
      DEFAULT_ZOOM: activeSettings?.map_default_zoom ?? FALLBACK_CONFIG.DEFAULT_ZOOM,
      ADMIN_DEFAULT_ZOOM: FALLBACK_CONFIG.ADMIN_DEFAULT_ZOOM,
      MIN_ZOOM: activeSettings?.map_min_zoom ?? FALLBACK_CONFIG.MIN_ZOOM,
      MAX_ZOOM: activeSettings?.map_max_zoom ?? FALLBACK_CONFIG.MAX_ZOOM,
      SEARCH_ZOOM: activeSettings?.map_search_zoom ?? FALLBACK_CONFIG.SEARCH_ZOOM,

      // These are UI constants, not configurable (keep from fallback)
      ZOOM_DELTA: FALLBACK_CONFIG.ZOOM_DELTA,
      ZOOM_SNAP: FALLBACK_CONFIG.ZOOM_SNAP,
      RECTANGLE_SIZE: FALLBACK_CONFIG.RECTANGLE_SIZE,
      MINIMAP: FALLBACK_CONFIG.MINIMAP,
    };
  }, [globalSettings, eventSettings, globalLoading]);

  return {
    MAP_CONFIG,
    MAP_LAYERS, // Not configurable in organization_settings yet
    BRANDING_CONFIG,
    loading,
    usingEventSettings: !!eventSettings, // Whether using event-specific settings
  };
}
