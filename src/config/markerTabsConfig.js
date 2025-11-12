/**
 * Configuration for marker table tabs and columns in AdminDashboard
 */

export const TABS = [
  { key: 'core', label: 'Markers - Core' },
  { key: 'appearance', label: 'Markers - Appearance' },
  { key: 'content', label: 'Markers - Content' },
  { key: 'admin', label: 'Markers - Admin' },
  { key: 'companies', label: 'Companies' },
  { key: 'eventSubscriptions', label: 'Event Subscriptions' },
  { key: 'assignments', label: 'Assignments' },
];

export const COLUMNS = {
  core: [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'lat', label: 'Lat' },
    { key: 'lng', label: 'Lng' },
    { key: 'rectangle', label: 'Rectangle' },
    { key: 'angle', label: 'Angle' },
  ],
  appearance: [
    { key: 'id', label: 'ID' },
    { key: 'glyph', label: 'Booth Label' },
    { key: 'name', label: 'Name' },
    { key: 'iconUrl', label: 'Icon' },
    { key: 'iconSize', label: 'Icon Size' },
    { key: 'className', label: 'Class Name' },
    { key: 'prefix', label: 'Prefix' },
    { key: 'glyphColor', label: 'Glyph Color' },
    { key: 'glyphSize', label: 'Glyph Size' },
    { key: 'glyphAnchor', label: 'Glyph Anchor' },
  ],
  content: [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'logo', label: 'Logo' },
    { key: 'website', label: 'Website' },
    { key: 'info', label: 'Info' },
  ],
  admin: [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'contact', label: 'Contact' },
    { key: 'phone', label: 'Phone' },
    { key: 'email', label: 'Email' },
    { key: 'boothCount', label: 'Booth Count' },
    { key: 'area', label: 'Area' },
    { key: 'coins', label: 'Coins' },
    { key: 'breakfast', label: 'Breakfast' },
    { key: 'lunch', label: 'Lunch' },
    { key: 'bbq', label: 'BBQ' },
    { key: 'notes', label: 'Notes' },
  ],
};

// Icon options for marker appearance configuration
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
