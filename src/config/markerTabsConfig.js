/**
 * Configuration for marker table tabs and columns in AdminDashboard
 */

// Re-export icon configuration from markerTableConfig to avoid duplication
export { ICON_OPTIONS, ICON_PATH_PREFIX } from './markerTableConfig';

export const TABS = [
  { key: 'core', label: 'Markers - Core' },
  { key: 'appearance', label: 'Markers - Appearance' },
  { key: 'content', label: 'Markers - Content' },
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
};
