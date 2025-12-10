import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * useTranslatedCompanyInfo - Get translated company info for public display
 *
 * For markers with company data, returns the info in the user's current language
 * with fallback to Dutch.
 *
 * @param {Object} marker - Marker object with company_translations array
 * @returns {string} Translated info text or empty string
 */
export function useTranslatedCompanyInfo(marker) {
  const { i18n } = useTranslation();
  const currentLanguage = i18n.language;

  const translatedInfo = useMemo(() => {
    if (!marker?.company_translations || marker.company_translations.length === 0) {
      // Fallback to deprecated info field for backward compatibility
      return marker?.info || '';
    }

    // Find translation for current language
    const currentTranslation = marker.company_translations.find(
      (t) => t.language_code === currentLanguage,
    );

    if (currentTranslation?.info) {
      return currentTranslation.info;
    }

    // Fallback to Dutch
    const dutchTranslation = marker.company_translations.find((t) => t.language_code === 'nl');

    if (dutchTranslation?.info) {
      return dutchTranslation.info;
    }

    // Fallback to any available translation
    const anyTranslation = marker.company_translations.find((t) => t.info);
    return anyTranslation?.info || '';
  }, [marker, currentLanguage]);

  return translatedInfo;
}

/**
 * getTranslatedInfo - Static helper for getting translated info from company data
 * Use this when you don't have access to hooks (e.g., in utility functions)
 *
 * @param {Array} translations - Array of translation objects
 * @param {string} languageCode - Preferred language code
 * @param {string} deprecatedInfo - Fallback info from Companies.info (deprecated)
 * @returns {string} Translated info text
 */
export function getTranslatedInfo(translations, languageCode = 'nl', deprecatedInfo = '') {
  if (!translations || translations.length === 0) {
    return deprecatedInfo || '';
  }

  // Find translation for requested language
  const currentTranslation = translations.find((t) => t.language_code === languageCode);

  if (currentTranslation?.info) {
    return currentTranslation.info;
  }

  // Fallback to Dutch
  const dutchTranslation = translations.find((t) => t.language_code === 'nl');

  if (dutchTranslation?.info) {
    return dutchTranslation.info;
  }

  // Fallback to any available translation
  const anyTranslation = translations.find((t) => t.info);
  return anyTranslation?.info || deprecatedInfo || '';
}
