// Utility to normalize logo paths for consistent rendering
export function getLogoPath(logo) {
  if (!logo) return '';
  if (logo.startsWith('/assets/logos/')) return logo;
  if (logo.startsWith('logos/')) return `/assets/logos/${logo.slice(6)}`;
  return `/assets/logos/${logo}`;
}
