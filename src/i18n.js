import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import nl from './locales/nl.json';
import de from './locales/de.json';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    nl: { translation: nl },
    de: { translation: de },
  },
  lng: 'nl', // default language (Dutch)
  fallbackLng: 'nl', // fallback to Dutch
  interpolation: {
    escapeValue: false,
  },
});

// Expose i18n on window for easy debugging in development (reversible)
if (typeof window !== 'undefined') {
  // Avoid clobbering an existing debug value
  if (!window.__i18n) window.__i18n = i18n;
}

export default i18n;

// Temporary safety: ensure important nested blocks (e.g. companies) are present
// in the active translation namespace for each supported language. Some dev/HMR
// setups can end up with partially-loaded resource bundles; this merges any
// missing keys from the static JSON files into the runtime store without
// overwriting existing keys.
// Extract companies from helpPanel.companies (where it actually exists in the JSON)
// and merge it as a top-level namespace so component code can use 'companies.*' keys.
const _pkgs = { en, nl, de };
['en', 'nl', 'de'].forEach((lang) => {
  try {
    const pkg = _pkgs[lang];
    // Extract companies from helpPanel.companies (where it actually exists)
    const companiesData = pkg?.helpPanel?.companies;

    if (companiesData && !i18n.store?.data?.[lang]?.translation?.companies) {
      i18n.addResourceBundle(lang, 'translation', { companies: companiesData }, true, true);
    }
  } catch (e) {
    // best-effort - do not throw during startup

    console.debug('[i18n] failed to merge companies for', lang, e && e.message);
  }
});

// Ensure branding.eventName exists and falls back to homePage.title when available
['en', 'nl', 'de'].forEach((lang) => {
  try {
    const pkg = _pkgs[lang];
    const eventTitle = pkg?.homePage?.title;
    if (eventTitle && !i18n.exists('branding.eventName', { lng: lang })) {
      // Add the branding.eventName key with the page title as a sensible default
      i18n.addResource(lang, 'translation', 'branding.eventName', eventTitle);
    }
  } catch (e) {
    console.debug('[i18n] failed to add branding.eventName for', lang, e && e.message);
  }
});
