// Utility to normalize icon paths for consistent rendering
export function getIconPath(iconUrl) {
  if (!iconUrl) return '';
  if (iconUrl.startsWith('http://') || iconUrl.startsWith('https://')) return iconUrl;

  // Normalize base URL to always have trailing slash
  const base = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;

  if (iconUrl.startsWith('/assets/icons/')) return `${base}${iconUrl.slice(1)}`;
  if (iconUrl.startsWith('icons/')) return `${base}assets/icons/${iconUrl.slice(6)}`;
  return `${base}assets/icons/${iconUrl}`;
}
