// Map configuration constants
export const MAP_CONFIG = {
  DEFAULT_POSITION: [51.898095078807025, 5.772961378097534],
  DEFAULT_ZOOM: 17,
  ADMIN_DEFAULT_POSITION: [51.898095078807025, 5.772961378097534], // example admin position
  ADMIN_DEFAULT_ZOOM: 17.5, // example admin zoom
  MIN_ZOOM: 14,
  MAX_ZOOM: 22,
  SEARCH_ZOOM: 19,
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
    APPLY_IN_ADMIN: true, // Disable in admin view for precise placement
    // Smooth animation settings: when enabled we apply GPU transform scaling during
    // map zoom animations and finalize sizes on zoomend.
    SMOOTH_ANIMATION: true,
    // If the number of visible markers exceeds this threshold we may avoid per-marker
    // transforms for performance (0 = always enable)
    SMOOTH_TRANSFORM_MARKER_THRESHOLD: 2000,
    SPECIAL_MARKER_MULTIPLIER: 1.1, // Special markers 20% larger than regular
    // Discrete zoom buckets with icon sizes [width, height]
    ZOOM_BUCKETS: [
      { minZoom: 14.0, maxZoom: 16.99, size: [6, 10] },
      { minZoom: 17.0, maxZoom: 17.49, size: [8, 13.33] },
      { minZoom: 17.5, maxZoom: 17.99, size: [12, 20] },
      { minZoom: 18.0, maxZoom: 18.49, size: [18, 30] },
      { minZoom: 18.5, maxZoom: 18.99, size: [25, 41] },
      { minZoom: 19.0, maxZoom: 19.49, size: [30, 50] },
      { minZoom: 19.5, maxZoom: 22.0, size: [38, 63.33] },
    ],
    DEFAULT_SIZE: [25, 41], // Fallback size
  },
};

// Default branding configuration
export const BRANDING_CONFIG = {
  DEFAULT_LOGO: '4x4Vakantiebeurs.png',
  getDefaultLogoPath: () => {
    // Access Vite's `import.meta.env.BASE_URL` safely. Jest (and some Node
    // environments) cannot parse `import.meta` at module parse time which
    // causes tests to fail. Use a runtime Function to access it when
    // available; otherwise fall back to process.env or '/'. This keeps the
    // code compatible with both Vite and Jest without causing parse errors.
    const getViteBase = () => {
      try {
        return new Function('return import.meta.env && import.meta.env.BASE_URL')();
      } catch (e) {
        return undefined;
      }
    };

    const base =
      getViteBase() ||
      (typeof process !== 'undefined' && process.env && process.env.BASE_URL) ||
      '/';
    const baseUrl = base.endsWith('/') ? base : `${base}/`;
    return `${baseUrl}assets/logos/${BRANDING_CONFIG.DEFAULT_LOGO}`;
  },
};

// Print configuration - single source of truth for all print modes
export const PRINT_CONFIG = {
  margin: { top: 3, right: 3, bottom: 3, left: 3 },
  maxZoom: 25, // Temporarily allow higher zoom during printing
  // If true, set the source map's zoom to the print mode zoom before the plugin
  // creates the print overlay so icons are already sized for the print zoom.
  // This is less robust (visible zoom change) but works with environments where
  // inlining or plugin cloning can't preserve computed icon sizing.
  SET_SOURCE_ZOOM_ON_PRINT: true,
  modes: {
    'A2 — Landscape (large floor plan)': {
      center: [51.898095078807025, 5.772961378097534],
      zoom: 17,
    },
    'A2 — Portrait (large floor plan)': {
      center: [51.89664504222346, 5.775062626578228],
      zoom: 18,
    },
    'A3 — Landscape': {
      center: [51.89689783985157, 5.7757150597931615],
      zoom: 18.5,
    },
    'A3 — Portrait': {
      center: [51.89664504222346, 5.775062626578228],
      zoom: 18.5,
    },
    'A4 — Landscape': {
      center: [51.89676207833922, 5.7757150597931615],
      zoom: 18,
    },
    'A4 — Portrait': {
      center: [51.89668717526025, 5.775062626578228],
      zoom: 18,
    },
  },
};

// Available map tile layers
export const MAP_LAYERS = [
  {
    key: 'carto',
    name: 'Carto Voyager',
    attribution: '&copy; <a href="https://carto.com/attributions">Carto</a>',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png',
  },
  {
    key: 'esri',
    name: 'Esri World Imagery',
    attribution:
      'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  },
];
