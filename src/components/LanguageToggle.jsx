import React from 'react';
import { useTranslation } from 'react-i18next';
import { usePreferences } from '../contexts/PreferencesContext';
import { useDialog } from '../contexts/DialogContext';

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'nl', label: 'Nederlands', flag: '🇳🇱' },
];

export default function LanguageToggle({ className = '', excludeCodes = [] }) {
  const { i18n } = useTranslation();
  // Allow excluding languages from the UI (used in tests and some embedded contexts)
  const availableLanguages = LANGUAGES.filter((l) => !excludeCodes.includes(l.code));
  const { preferences, updatePreference } = usePreferences();
  const { toastError, toastWarning } = useDialog();
  const current = i18n.language;

  const handleLanguageChange = async (langCode) => {
    // Update i18n immediately for instant UI feedback
    i18n.changeLanguage(langCode);
    // Save to localStorage for instant persistence on refresh
    localStorage.setItem('preferredLanguage', langCode);

    // Save to database for cross-device sync (only if user is logged in)
    // preferences will be null/undefined when not authenticated
    if (preferences) {
      try {
        await updatePreference('preferred_language', langCode);
      } catch (error) {
        // Check if it's a conflict error
        if (error.message.includes('updated from another device')) {
          toastWarning(error.message);
        } else {
          toastError('Failed to save language preference. Please try again.');
        }
      }
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {availableLanguages.map((lang) => (
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
