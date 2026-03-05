// Utility to get the base URL
export function getBaseUrl() {
  // Option 1: Prefer Vite's import.meta.env.BASE_URL if available (Build & Dev)
  // We use a safe check to avoid crashing in environments that don't support import.meta
  try {
    // eslint-disable-next-line
    if (import.meta && import.meta.env && import.meta.env.BASE_URL) {
      return import.meta.env.BASE_URL;
    }
  } catch (e) {
    // Ignore ReferenceError/SyntaxError
  }

  // Option 2: Fallback to global define (Jest/Node)
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
