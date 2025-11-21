import React from 'react';
import { useTranslation } from 'react-i18next';
import Icon from '@mdi/react';
import { mdiTranslate } from '@mdi/js';
import LanguageToggle from '../LanguageToggle';

/**
 * UILanguageSettings - Manage the manager's interface language
 * This is separate from content translations (companies info)
 */
export default function UILanguageSettings() {
  const { t } = useTranslation();

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-3 mb-6">
        <Icon path={mdiTranslate} size={1.2} className="text-blue-600" />
        <div>
          <h2 className="text-xl font-bold text-gray-900">{t('settings.uiLanguage.title')}</h2>
          <p className="text-sm text-gray-600 mt-1">{t('settings.uiLanguage.description')}</p>
        </div>
      </div>

      {/* Language Selection */}
      <div className="space-y-4">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <Icon path={mdiTranslate} size={0.9} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">{t('settings.uiLanguage.note.title')}</p>
              <p>{t('settings.uiLanguage.note.description')}</p>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            {t('settings.uiLanguage.selectLanguage')}
          </label>
          <LanguageToggle />
        </div>
      </div>
    </div>
  );
}
