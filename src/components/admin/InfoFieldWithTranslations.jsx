import React, { useState, useEffect } from 'react';
import useCompanyTranslations from '../../hooks/useCompanyTranslations';
import ContentLanguageTabs from './ContentLanguageTabs';
import { useTranslation } from 'react-i18next';

// Note: translateSafe is defined in CompaniesTab; we provide a tiny helper that uses i18n
// If your project centralizes translateSafe differently, adjust the import above.

export default function InfoFieldWithTranslations({
  companyId,
  editingLanguage,
  onLanguageChange,
  createMode = false,
  initialTranslations = {},
  onTranslationsChange,
}) {
  const { translations: hookTranslations, saveTranslation } = useCompanyTranslations(companyId);
  const { t } = useTranslation();
  const [localValue, setLocalValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [localTranslations, setLocalTranslations] = useState(initialTranslations || {});

  // Choose source translations depending on mode
  const translations = companyId ? hookTranslations : localTranslations;

  // Update local value when language or translations change
  useEffect(() => {
    setLocalValue(translations[editingLanguage] || '');
  }, [editingLanguage, translations]);

  // Reset local translations when initialTranslations change in create mode
  useEffect(() => {
    if (createMode) setLocalTranslations(initialTranslations || {});
  }, [initialTranslations, createMode]);

  const handleBlur = async () => {
    if (companyId) {
      if (localValue !== (hookTranslations[editingLanguage] || '')) {
        setIsSaving(true);
        try {
          await saveTranslation(editingLanguage, localValue);
        } catch (error) {
          console.error('Failed to save translation:', error);
        } finally {
          setIsSaving(false);
        }
      }
    } else {
      // create-mode: update local translations and notify parent via callback
      if (localValue !== (localTranslations[editingLanguage] || '')) {
        const updated = { ...(localTranslations || {}), [editingLanguage]: localValue };
        setLocalTranslations(updated);
        if (typeof onTranslationsChange === 'function') onTranslationsChange(updated);
      }
    }
  };

  return (
    <div className="space-y-2">
      <ContentLanguageTabs
        currentLanguage={editingLanguage}
        onLanguageChange={onLanguageChange}
        translations={translations}
        className="mb-2"
      />
      <textarea
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        className="w-full bg-white text-gray-900 border rounded px-2 py-1"
        rows={4}
        placeholder={t('companies.modal.enterInfoInLanguage', {
          lang: editingLanguage === 'nl' ? t('languages.dutch') : t('languages.english'),
        })}
        disabled={isSaving}
      />
      {isSaving && <span className="text-xs text-gray-500 italic">{t('companies.saving')}</span>}
    </div>
  );
}
