// Utility to normalize icon paths for consistent rendering
export function getIconPath(iconUrl) {
  if (!iconUrl) return '';
  if (iconUrl.startsWith('http://') || iconUrl.startsWith('https://')) return iconUrl;
  if (iconUrl.startsWith('/assets/icons/')) return `${import.meta.env.BASE_URL}${iconUrl.slice(1)}`;
  if (iconUrl.startsWith('icons/'))
    return `${import.meta.env.BASE_URL}assets/icons/${iconUrl.slice(6)}`;
  return `${import.meta.env.BASE_URL}assets/icons/${iconUrl}`;
}
