import React from 'react';
import Icon from '@mdi/react';
import { mdiCheck, mdiPlus } from '@mdi/js';

/**
 * ContentLanguageTabs - Language tabs for content translation editing
 * Shows which languages have content, allows switching between them
 */
const AVAILABLE_LANGUAGES = [
  { code: 'nl', label: 'Nederlands', flag: '🇳🇱' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
];

export default function ContentLanguageTabs({
  currentLanguage,
  onLanguageChange,
  translations = {},
  className = '',
}) {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {AVAILABLE_LANGUAGES.map((lang) => {
        const isActive = currentLanguage === lang.code;
        const hasContent = translations[lang.code] && translations[lang.code].trim() !== '';

        return (
          <button
            key={lang.code}
            type="button"
            onClick={() => onLanguageChange(lang.code)}
            className={`px-2 py-1 rounded text-xs font-medium transition flex items-center gap-1 ${
              isActive
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span>{lang.flag}</span>
            <span>{lang.code.toUpperCase()}</span>
            {hasContent && !isActive && (
              <Icon path={mdiCheck} size={0.5} className="text-green-600" />
            )}
          </button>
        );
      })}
    </div>
  );
}

/**
 * LanguageIndicator - Shows 🌐 icon when multiple translations exist
 * Used in non-editing mode
 */
export function LanguageIndicator({ translations = {} }) {
  const languageCount = Object.keys(translations).filter(
    key => translations[key] && translations[key].trim() !== ''
  ).length;

  if (languageCount <= 1) return null;

  return (
    <span 
      className="inline-block ml-1 text-blue-600" 
      title={`Available in ${languageCount} languages`}
    >
      🌐
    </span>
  );
}
