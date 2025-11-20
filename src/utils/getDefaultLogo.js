import { BRANDING_CONFIG } from '../config/mapConfig';
import { getLogoPath } from './getLogoPath';

/**
 * Gets the default fallback logo path
 * Should be used with the organization logo from context
 * @param {string} organizationLogo - The logo filename from Organization_Profile
 * @returns {string} Full path to the logo
 */
export function getDefaultLogoPath(organizationLogo) {
  const logoFile = organizationLogo || BRANDING_CONFIG.DEFAULT_LOGO;
  // Normalize base URL to always have trailing slash
  const base = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;
  return `${base}assets/logos/${logoFile}`;
}

/**
 * Gets the logo path with fallback to organization logo
 * Use this in components that need logo with fallback
 * @param {string} logoPath - The logo path/filename to use
 * @param {string} organizationLogo - The organization logo from context
 * @returns {string} Full resolved logo path
 */
export function getLogoWithFallback(logoPath, organizationLogo) {
  if (logoPath && logoPath.trim() !== '') {
    return getLogoPath(logoPath);
  }
  return getDefaultLogoPath(organizationLogo);
}
