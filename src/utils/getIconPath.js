// Utility to normalize icon paths for consistent rendering
export function getIconPath(iconUrl) {
  if (!iconUrl) return '';
  if (iconUrl.startsWith('http://') || iconUrl.startsWith('https://')) return iconUrl;
  if (iconUrl.startsWith('/assets/icons/')) return iconUrl;
  if (iconUrl.startsWith('icons/')) return `/assets/icons/${iconUrl.slice(6)}`;
  return `/assets/icons/${iconUrl}`;
}
