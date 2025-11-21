import { getBaseUrl } from './getBaseUrl';

// Utility to normalize icon paths for consistent rendering
export function getIconPath(iconUrl) {
  if (!iconUrl) return '';
  if (iconUrl.startsWith('http://') || iconUrl.startsWith('https://')) return iconUrl;

  const base = getBaseUrl();

  if (iconUrl.startsWith('/assets/icons/')) return `${base}${iconUrl.slice(1)}`;
  if (iconUrl.startsWith('icons/')) return `${base}assets/icons/${iconUrl.slice(6)}`;
  return `${base}assets/icons/${iconUrl}`;
}
