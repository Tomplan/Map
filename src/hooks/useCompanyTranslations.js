import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

/**
 * useCompanyTranslations - Manage company content translations
 * Separate from UI translations (i18n) - this is for user-facing content
 */
export default function useCompanyTranslations(companyId) {
  const [translations, setTranslations] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load all translations for a company
  const loadTranslations = useCallback(async () => {
    if (!companyId) {
      setTranslations({});
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('company_translations')
        .select('language_code, info')
        .eq('company_id', companyId);

      if (fetchError) throw fetchError;

      // Convert array to object: { 'nl': 'text...', 'en': 'text...' }
      const translationsMap = {};
      (data || []).forEach(t => {
        translationsMap[t.language_code] = t.info;
      });

      setTranslations(translationsMap);
    } catch (err) {
      console.error('Error loading translations:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  // Save or update a translation for a specific language
  const saveTranslation = async (languageCode, info) => {
    if (!companyId) return;

    try {
      setError(null);

      const { error: upsertError } = await supabase
        .from('company_translations')
        .upsert(
          {
            company_id: companyId,
            language_code: languageCode,
            info: info,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'company_id,language_code',
          }
        );

      if (upsertError) throw upsertError;

      // Update local state
      setTranslations(prev => ({
        ...prev,
        [languageCode]: info,
      }));

      return true;
    } catch (err) {
      console.error('Error saving translation:', err);
      setError(err.message);
      return false;
    }
  };

  // Delete a translation for a specific language
  const deleteTranslation = async (languageCode) => {
    if (!companyId) return;

    try {
      setError(null);

      const { error: deleteError } = await supabase
        .from('company_translations')
        .delete()
        .eq('company_id', companyId)
        .eq('language_code', languageCode);

      if (deleteError) throw deleteError;

      // Update local state
      setTranslations(prev => {
        const updated = { ...prev };
        delete updated[languageCode];
        return updated;
      });

      return true;
    } catch (err) {
      console.error('Error deleting translation:', err);
      setError(err.message);
      return false;
    }
  };

  // Get translation for a specific language with fallback
  const getTranslation = (languageCode, fallbackLanguage = 'nl') => {
    return translations[languageCode] || translations[fallbackLanguage] || '';
  };

  // Get available languages for this company
  const getAvailableLanguages = () => {
    return Object.keys(translations);
  };

  // Load translations on mount or when companyId changes
  useEffect(() => {
    loadTranslations();
  }, [loadTranslations]);

  return {
    translations,
    loading,
    error,
    saveTranslation,
    deleteTranslation,
    getTranslation,
    getAvailableLanguages,
    reload: loadTranslations,
  };
}
