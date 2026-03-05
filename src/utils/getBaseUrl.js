// Utility to get the base URL
export function getBaseUrl() {
  // FINAL ATTEMPT: The most robust way to get the base URL is to check the current window location
  // if we are in a browser environment. This bypasses all build-time variable issues.
  if (typeof window !== 'undefined' && window.location && window.location.pathname) {
    const path = window.location.pathname;
    
    // Check if we are in the development deployment (/Map/dev/)
    if (path.includes('/Map/dev') || path.includes('/map/dev')) {
      return '/Map/dev/';
    }
    
    // Check if we are in the production deployment (/Map/)
    // We check this AFTER /Map/dev/ because /Map/ is a substring of /Map/dev/
    if (path.includes('/Map/') || path.includes('/map/')) {
      return '/Map/';
    }
  }

  // Fallback 1: Global define (Vite/Jest/Node)
  // This is defined in vite.config.js and jest.config.cjs
  // avoiding import.meta issues in Jest/CJS environments
  if (typeof __APP_BASE_URL__ !== 'undefined') {
    return __APP_BASE_URL__;
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
