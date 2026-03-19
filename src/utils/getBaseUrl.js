// Utility to get the base URL
export function getBaseUrl() {
  // Prefer the compile-time base URL (set by Vite's define in vite.config.js
  // and Jest globals in jest.config.cjs). This is always correct for the build
  // target and avoids issues where window.location.pathname differs from the
  // actual asset base path (e.g. stale service worker redirects, bookmarks to
  // wrong URLs, or browser history entries from a different deployment).
  if (typeof __APP_BASE_URL__ !== 'undefined') {
    return __APP_BASE_URL__;
  }

  // Fallback: derive from window location (for environments without the define)
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
