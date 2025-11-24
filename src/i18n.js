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

export default i18n;
