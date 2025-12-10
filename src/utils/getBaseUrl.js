/**
 * Get the normalized base URL with trailing slash.
 * This ensures consistent URL construction across the app.
 * @returns {string} Base URL with trailing slash
 */
export function getBaseUrl() {
  const baseUrl = import.meta.env.BASE_URL;
  return baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
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
  if (relativePath.startsWith('http://') || 
      relativePath.startsWith('https://') || 
      relativePath.startsWith('data:')) {
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
