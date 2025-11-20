/**
 * Get the normalized base URL with trailing slash.
 * This ensures consistent URL construction across the app.
 * @returns {string} Base URL with trailing slash
 */
export function getBaseUrl() {
  const baseUrl = import.meta.env.BASE_URL;
  return baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
}
