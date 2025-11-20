// Utility to normalize logo paths for consistent rendering
export function getLogoPath(logo) {
  if (!logo) return '';

  // If it's a full URL (http/https), return as-is
  if (logo.startsWith('http://') || logo.startsWith('https://')) {
    return logo;
  }

  // Normalize base URL to always have trailing slash
  const base = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;

  // Handle local paths
  if (logo.startsWith('/assets/logos/')) return `${base}${logo.slice(1)}`;
  if (logo.startsWith('logos/')) return `${base}assets/logos/${logo.slice(6)}`;
  return `${base}assets/logos/${logo}`;
}
