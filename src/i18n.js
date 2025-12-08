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
