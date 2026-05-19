import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

function normalizeLanguageCode(languageCode) {
  return String(languageCode || 'nl')
    .toLowerCase()
    .split('-')[0];
}

function findTranslation(translations, languageCode) {
  const normalized = normalizeLanguageCode(languageCode);
  return translations.find(
    (translation) => normalizeLanguageCode(translation.language_code) === normalized,
  );
}

function resolveTranslatedInfo(translations, languageCode = 'nl', deprecatedInfo = '') {
  if (!translations || translations.length === 0) {
    return deprecatedInfo || '';
  }

  const normalizedLanguage = normalizeLanguageCode(languageCode);
  const currentTranslation = findTranslation(translations, normalizedLanguage);
  if (currentTranslation?.info) {
    return currentTranslation.info;
  }

  // Only Dutch can fall back to the legacy single-language field.
  if (normalizedLanguage === 'nl') {
    const dutchTranslation = findTranslation(translations, 'nl');
    if (dutchTranslation?.info) {
      return dutchTranslation.info;
    }

    const anyTranslation = translations.find((translation) => translation.info);
    return anyTranslation?.info || deprecatedInfo || '';
  }

  return '';
}

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
    return resolveTranslatedInfo(marker?.company_translations, currentLanguage, marker?.info || '');
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
  return resolveTranslatedInfo(translations, languageCode, deprecatedInfo);
}
