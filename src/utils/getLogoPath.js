import { getBaseUrl } from './getBaseUrl';

// Utility to normalize logo paths for consistent rendering
export function getLogoPath(logo) {
  if (!logo) return '';

  // If it's a full URL (http/https), return as-is
  if (logo.startsWith('http://') || logo.startsWith('https://')) {
    return logo;
  }

  const base = getBaseUrl();

  // Handle local paths
  if (logo.startsWith('/assets/logos/')) return `${base}${logo.slice(1)}`;
  if (logo.startsWith('logos/')) return `${base}assets/logos/${logo.slice(6)}`;
  return `${base}assets/logos/${logo}`;
}

/**
 * Build responsive sources for logos placed under the generated folder.
 * Accepts either a full URL (returned as-is), or a filename/path relative to assets/logos.
 * Returns an object { src, srcSet, sizes } which can be used in <img>.
 */
export function getResponsiveLogoSources(iconUrl) {
  if (!iconUrl) return null;

  // If it's an absolute URL, just return normal src
  if (iconUrl.startsWith('http://') || iconUrl.startsWith('https://')) {
    return { src: iconUrl, srcSet: null, sizes: null };
  }

  // Normalize base URL
  const base = getBaseUrl();

  // If path already contains generated/ use it directly
  const isGenerated = iconUrl.includes('generated/') || iconUrl.includes('-128.webp');

  // Remove path/extension to form base name
  const filename = iconUrl.split('/').pop();
  const basename = filename.replace(/\.[^.]+$/, '');

  // Prefer CDN-hosted generated assets (Supabase public storage) if VITE_SUPABASE_URL exists
  const supabaseUrl = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_SUPABASE_URL : null;
  const cdnBase = supabaseUrl ? `${supabaseUrl.replace(/\/$/, '')}/storage/v1/object/public/Logos/generated/${basename}` : null;
  const generatedBase = cdnBase || `${base}assets/logos/generated/${basename}`;

  const src = `${generatedBase}-128.webp`;
  const srcSet = `${generatedBase}-64.webp 64w, ${generatedBase}-128.webp 128w, ${generatedBase}-256.webp 256w, ${generatedBase}-512.webp 512w`;
  const sizes = '(max-width: 640px) 64px, 128px';

  return { src, srcSet, sizes };
}
