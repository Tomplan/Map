// Utility to normalize logo paths for consistent rendering
export function getLogoPath(logo) {
  if (!logo) return '';

  // If it's a full URL (http/https), return as-is
  if (logo.startsWith('http://') || logo.startsWith('https://')) {
    return logo;
  }

  // Handle local paths
  if (logo.startsWith('/assets/logos/')) return `${import.meta.env.BASE_URL}${logo.slice(1)}`;
  if (logo.startsWith('logos/')) return `${import.meta.env.BASE_URL}assets/logos/${logo.slice(6)}`;
  return `${import.meta.env.BASE_URL}assets/logos/${logo}`;
}
