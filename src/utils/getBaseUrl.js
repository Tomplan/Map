// Utility to get the base URL
export function getBaseUrl() {
  // Vite natively exposes the resolved base path (from vite.config.js `base` option)
  // via import.meta.env.BASE_URL. This is the only 100% reliable way to know where 
  // Vite thinks assets are served from, regardless of the browser address bar.
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL) {
    return import.meta.env.BASE_URL;
  }

  // Fallback 1: Global define (Vite/Jest/Node)
  if (typeof __APP_BASE_URL__ !== 'undefined') {
    return __APP_BASE_URL__;
  }

  // Fallback 2: Browser path heuristics for non-Vite environments
  if (typeof window !== 'undefined' && window.location && window.location.pathname) {
    const path = window.location.pathname;
    return path.substring(0, path.lastIndexOf('/') + 1);
  }

  return '/';
}

/**
 * Convert a relative or base-relative URL to an absolute URL.
 * Essential for print contexts (BrowserPrint iframe) where relative paths may not resolve.
 * @param {string} relativePath - Path to convert (relative, base-relative, or already absolute)
 * @returns {string} Absolute URL with protocol and origin
 */
export function getAbsoluteUrl(relativePath) {
  if (!relativePath) return '';

  // Already absolute or data URI - return as-is
  if (
    relativePath.startsWith('http://') ||
    relativePath.startsWith('https://') ||
    relativePath.startsWith('data:')
  ) {
    return relativePath;
  }

  // Convert relative to absolute using window.location.origin
  const base = getBaseUrl();
  const fullPath = relativePath.startsWith('/') ? relativePath : `${base}${relativePath}`;

  // Ensure we have window.location available (not in Node/test env)
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    return `${window.location.origin}${fullPath}`;
  }

  // Fallback for test environments
  return fullPath;
}
