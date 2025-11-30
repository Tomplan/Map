// Icon options for marker appearance
export const ICON_OPTIONS = [
  'glyph-marker-icon-black.svg',
  'glyph-marker-icon-blue.svg',
  'glyph-marker-icon-gray.svg',
  'glyph-marker-icon-green.svg',
  'glyph-marker-icon-orange.svg',
  'glyph-marker-icon-purple.svg',
  'glyph-marker-icon-red.svg',
  'glyph-marker-icon-yellow.svg',
];

export const ICON_PATH_PREFIX = `${import.meta.env.BASE_URL}assets/icons/`;

// Tab definitions
// Note: ADMIN tab removed - admin data now managed via Event_Subscriptions
export const TABS = {
  CORE: 'core',
  APPEARANCE: 'appearance',
  CONTENT: 'content',
};

// Field to table mapping
export const FIELD_TABLE_MAP = {
  // Core fields
  lat: 'markers_core',
  lng: 'markers_core',
  type: 'markers_core',
  angle: 'markers_core',
  rectWidth: 'markers_core',
  rectHeight: 'markers_core',
  coreLocked: 'markers_core',

  // Appearance fields
  iconUrl: 'markers_appearance',
  iconSize: 'markers_appearance',
  iconColor: 'markers_appearance',
  className: 'markers_appearance',
  prefix: 'markers_appearance',
  glyph: 'markers_appearance',
  glyphColor: 'markers_appearance',
  glyphSize: 'markers_appearance',
  // Per-marker sizing fields - single source of truth
  shadowScale: 'markers_appearance',
  glyphAnchor: 'markers_appearance',
  appearanceLocked: 'markers_appearance',

  // Content fields
  // Note: boothNumber removed - now using glyphText from Markers_Appearance
  name: 'markers_content',
  logo: 'markers_content',
  website: 'markers_content',
  info: 'markers_content',
  contentLocked: 'markers_content',

  // Note: Admin fields (contact, phone, meals, etc.) removed
  // These are now managed via Event_Subscriptions table
};

// Column definitions for each tab
export const COLUMN_CONFIGS = {
  [TABS.CORE]: [
    { key: 'id', label: 'ID', editable: false },
    { key: 'lat', label: 'Latitude', type: 'number' },
    { key: 'lng', label: 'Longitude', type: 'number' },
    { key: 'type', label: 'Type' },
    { key: 'angle', label: 'Angle', type: 'number' },
    { key: 'rectWidth', label: 'Rect Width', type: 'number' },
    { key: 'rectHeight', label: 'Rect Height', type: 'number' },
    { key: 'coreLocked', label: 'Locked', type: 'boolean' },
  ],
  [TABS.APPEARANCE]: [
    { key: 'id', label: 'ID', editable: false },
    { key: 'iconUrl', label: 'Icon URL', type: 'icon' },
    { key: 'iconSize', label: 'Icon Size', type: 'array' },
    { key: 'iconColor', label: 'Icon Color' },
    { key: 'className', label: 'Class Name' },
    { key: 'prefix', label: 'Prefix' },
    { key: 'glyph', label: 'Glyph' },
    { key: 'glyphColor', label: 'Glyph Color' },
    { key: 'glyphSize', label: 'Glyph Size' },
    { key: 'iconSize', label: 'Icon Size', type: 'array' },
    { key: 'shadowScale', label: 'Shadow Scale', type: 'number' },
    { key: 'glyphAnchor', label: 'Glyph Anchor', type: 'array' },
    { key: 'appearanceLocked', label: 'Locked', type: 'boolean' },
  ],
  [TABS.CONTENT]: [
    { key: 'id', label: 'ID', editable: false },
    // Note: boothNumber removed - now using glyphText from Markers_Appearance
    { key: 'name', label: 'Name' },
    { key: 'logo', label: 'Logo', type: 'logo' },
    { key: 'website', label: 'Website' },
    { key: 'info', label: 'Info', type: 'textarea' },
    { key: 'contentLocked', label: 'Locked', type: 'boolean' },
  ],
  // Note: ADMIN tab removed - admin data managed via Event_Subscriptions
};

// Lock field for each tab
export const TAB_LOCK_FIELDS = {
  [TABS.CORE]: 'coreLocked',
  [TABS.APPEARANCE]: 'appearanceLocked',
  [TABS.CONTENT]: 'contentLocked',
};

// All lock fields
export const LOCK_FIELDS = ['coreLocked', 'appearanceLocked', 'contentLocked'];
