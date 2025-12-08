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
// Use the statically-imported locale objects to merge in the companies block
// only if it's not already present in the runtime store. This is a safe
// best-effort merge (non-destructive) to unblock the UI while debugging root
// causes where resources can sometimes be partially loaded in dev/HMR.
const _pkgs = { en, nl, de };
['en', 'nl', 'de'].forEach((lang) => {
  try {
    const pkg = _pkgs[lang];
    if (pkg && pkg.companies && (!i18n.store?.data?.[lang]?.translation?.companies)) {
      i18n.addResourceBundle(lang, 'translation', { companies: pkg.companies }, true, true);
    }
  } catch (e) {
    // best-effort - do not throw during startup
    // eslint-disable-next-line no-console
    console.debug('[i18n] failed to merge companies for', lang, e && e.message);
  }
});
