// Map configuration constants
export const MAP_CONFIG = {
  DEFAULT_POSITION: [51.898095078807025, 5.772961378097534],
  DEFAULT_ZOOM: 17,
  MIN_ZOOM: 14,
  MAX_ZOOM: 22,
  SEARCH_ZOOM: 21,
  ZOOM_DELTA: 0.5,
  ZOOM_SNAP: 0.5,
  RECTANGLE_SIZE: [6, 6],
  MINIMAP: {
    WIDTH: 120,
    HEIGHT: 120,
    ZOOM_LEVEL: 15,
    AIMING_COLOR: '#1976d2',
    SHADOW_COLOR: '#90caf9',
  },
  MARKER_SIZING: {
    ENABLED: true, // Enable zoom-based marker sizing
    APPLY_IN_ADMIN: false, // Disable in admin view for precise placement
    SPECIAL_MARKER_MULTIPLIER: 1.2, // Special markers 20% larger than regular
    // Discrete zoom buckets with icon sizes [width, height]
    ZOOM_BUCKETS: [
      { minZoom: 14.0, maxZoom: 18.49, size: [8, 13.33] }, // Original size at default zoom 17
      { minZoom: 18.5, maxZoom: 19.49, size: [15, 25] }, // Reference size (bigger)
      { minZoom: 19.5, maxZoom: 22.0, size: [20, 33.33] }, // Even larger when zoomed in
    ],
    DEFAULT_SIZE: [25, 41], // Fallback size
  },
};

// Default branding configuration
export const BRANDING_CONFIG = {
  DEFAULT_LOGO: '4x4Vakantiebeurs.png',
  getDefaultLogoPath: () => {
    const base = import.meta.env.BASE_URL || '/';
    const baseUrl = base.endsWith('/') ? base : `${base}/`;
    return `${baseUrl}assets/logos/${BRANDING_CONFIG.DEFAULT_LOGO}`;
  },
};

// Available map tile layers
export const MAP_LAYERS = [
  {
    key: 'carto',
    name: 'Carto Voyager',
    attribution: '&copy; <a href="https://carto.com/attributions">Carto</a>',
    url: 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/rastertiles/voyager_nolabels/{z}/{x}/{y}.png',
  },
  {
    key: 'esri',
    name: 'Esri World Imagery',
    attribution:
      'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  },
];
