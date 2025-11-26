import React from 'react';
import { useTranslation } from 'react-i18next';
import { usePreferences } from '../contexts/PreferencesContext';

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'nl', label: 'Nederlands', flag: '🇳🇱' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
];

export default function LanguageToggle({ className = '' }) {
  const { i18n } = useTranslation();
  const { updatePreference } = usePreferences();
  const current = i18n.language;

  const handleLanguageChange = async (langCode) => {
    // Update i18n immediately for instant UI feedback
    i18n.changeLanguage(langCode);
    // Save to localStorage for instant persistence on refresh
    localStorage.setItem('preferredLanguage', langCode);
    // Save to database for cross-device sync
    await updatePreference('preferred_language', langCode);
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {LANGUAGES.map((lang) => (
        <button
          key={lang.code}
          onClick={() => handleLanguageChange(lang.code)}
          className={`px-2 py-1 rounded border text-xs font-semibold transition focus:outline-none flex items-center gap-1 ${
            current === lang.code
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-blue-600 border-blue-300 hover:bg-blue-50'
          }`}
          aria-pressed={current === lang.code}
        >
          <span style={{ fontSize: '1.1em' }}>{lang.flag}</span>
          {lang.label}
        </button>
      ))}
    </div>
  );
}
