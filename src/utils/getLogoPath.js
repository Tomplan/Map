import { getBaseUrl } from './getBaseUrl';

// Utility to normalize logo paths for consistent rendering
export function getLogoPath(logo) {
  if (!logo) return '';

  // If it's a full URL (http/https), normalize CDN-hosted Supabase storage
  // URLs to the generated responsive variant (-128.webp) where available.
  if (logo.startsWith('http://') || logo.startsWith('https://')) {
    try {
      const urlObj = new URL(logo);

      // Look for Supabase storage public path; handle both /Logos/generated and /Logos/companies
      const publicPrefix = '/storage/v1/object/public/Logos/';
      const idx = urlObj.pathname.indexOf(publicPrefix);
      if (idx !== -1) {
        const remaining = urlObj.pathname.slice(idx + publicPrefix.length); // e.g. 'generated/Camp%20Impuls.png' or 'companies/abc.png'
        // We prefer the generated variants under 'generated/'. If the URL already points to generated
        // and the filename doesn't contain a size suffix (e.g. -128.webp), rewrite to -128.webp.
        const parts = remaining.split('/');
        const folder = parts[0];
        const filename = parts.slice(1).join('/');
        if (!filename) return logo;

        // decode then re-encode as basename (strip extension)
        const decoded = decodeURIComponent(filename);
        // If filename already looks like a sized generated variant, return the original url
        // If filename already looks like a sized generated variant, return the original url
        // (match '-64', '-128', '-256', or '-512' followed by .webp or .avif)
        if (/-(?:64|128|256|512)\.(webp|avif)$/i.test(decoded)) {
          return logo;
        }

        // Build the new generated base URL.
        const basename = decoded.replace(/\.[^.]+$/, '');
        const genBase = `${urlObj.origin}${publicPrefix}generated/${encodeURIComponent(basename)}`;
        return `${genBase}-128.webp`;
      }
    } catch (err) {
      // If parsing fails, just fall through and return the original absolute URL
    }

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

  // If it's an absolute URL, try to normalize CDN-hosted generated paths into
  // the same responsive naming convention (basename-64/128/256/512.webp).
  // This covers DB values that were updated to full CDN URLs during migration.
  if (iconUrl.startsWith('http://') || iconUrl.startsWith('https://')) {
    try {
      const urlObj = new URL(iconUrl);
      // detect Supabase storage public path for Logos (generated or other folders)
      const publicPrefix = '/storage/v1/object/public/Logos/';
      const idx = urlObj.pathname.indexOf(publicPrefix);
      if (idx !== -1) {
        const remaining = urlObj.pathname.slice(idx + publicPrefix.length); // e.g. 'generated/foo.png' or 'companies/foo.png'
        const parts = remaining.split('/');
        const folder = parts[0];
        const filename = parts.slice(1).join('/');
        if (!filename) return { src: iconUrl, srcSet: null, sizes: null };

        const decoded = decodeURIComponent(filename);
        // If filename already contains a size suffix (e.g. -128.webp) we still want to
        // return a full srcSet for all variants. Strip the size suffix to produce the
        // canonical basename used by generated variants.
        let basename = decoded.replace(/\.[^.]+$/, '');
        const sizedMatch = basename.match(/^(.*)-(?:64|128|256|512)$/i);
        if (sizedMatch) {
          // remove the '-128' portion to get the original basename
          basename = sizedMatch[1];
        }
        const genBase = `${urlObj.origin}${publicPrefix}generated/${encodeURIComponent(basename)}`;
        const src = `${genBase}-128.webp`;
        const srcSet = `${genBase}-64.webp 64w, ${genBase}-128.webp 128w, ${genBase}-256.webp 256w, ${genBase}-512.webp 512w`;
        const sizes = '(max-width: 640px) 64px, 128px';
        return { src, srcSet, sizes };
      }
    } catch (err) {
      // If parsing fails, fall-through to returning original absolute URL
    }

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
  const supabaseUrl =
    typeof import.meta !== 'undefined' ? import.meta.env?.VITE_SUPABASE_URL : null;
  const cdnBase = supabaseUrl
    ? `${supabaseUrl.replace(/\/$/, '')}/storage/v1/object/public/Logos/generated/${basename}`
    : null;
  const generatedBase = cdnBase || `${base}assets/logos/generated/${basename}`;

  const src = `${generatedBase}-128.webp`;
  const srcSet = `${generatedBase}-64.webp 64w, ${generatedBase}-128.webp 128w, ${generatedBase}-256.webp 256w, ${generatedBase}-512.webp 512w`;
  const sizes = '(max-width: 640px) 64px, 128px';

  return { src, srcSet, sizes };
}
