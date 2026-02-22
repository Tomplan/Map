import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

/**
 * useCompanyTranslations - Manage company content translations
 * Separate from UI translations (i18n) - this is for user-facing content
 */
export default function useCompanyTranslations(companyId) {
  // cache per companyId
  if (!useCompanyTranslations.cache) useCompanyTranslations.cache = new Map();
  let entry = companyId ? useCompanyTranslations.cache.get(companyId) : null;
  if (companyId && !entry) {
    entry = {
      state: { translations: {}, loading: false, error: null },
      listeners: new Set(),
      refCount: 0,
      loadPromise: null,
    };
    useCompanyTranslations.cache.set(companyId, entry);
  }

  const [local, setLocal] = useState(
    entry ? { ...entry.state } : { translations: {}, loading: false, error: null },
  );

  // Load all translations for a company (updates entry)
  const loadTranslations = useCallback(async () => {
    if (!companyId) {
      if (entry) {
        entry.state.translations = {};
        entry.listeners.forEach((l) => l(entry.state));
      }
      setLocal({ translations: {}, loading: false, error: null });
      return;
    }

    if (entry.loadPromise) return entry.loadPromise;

    entry.state.loading = true;
    entry.state.error = null;
    entry.listeners.forEach((l) => l(entry.state));

    entry.loadPromise = (async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('company_translations')
          .select('language_code, info')
          .eq('company_id', companyId);
        if (fetchError) throw fetchError;

        const translationsMap = {};
        (data || []).forEach((t) => {
          translationsMap[t.language_code] = t.info;
        });
        entry.state.translations = translationsMap;
      } catch (err) {
        console.error('Error loading translations:', err);
        entry.state.error = err.message;
      } finally {
        entry.state.loading = false;
        entry.listeners.forEach((l) => l(entry.state));
        entry.loadPromise = null;
      }
    })();

    return entry.loadPromise;
  }, [companyId, entry]);

  // Save or update a translation for a specific language
  const saveTranslation = async (languageCode, info) => {
    if (!companyId) return;

    try {
      // clear any existing error on entry
      if (entry) entry.state.error = null;

      const { error: upsertError } = await supabase.from('company_translations').upsert(
        {
          company_id: companyId,
          language_code: languageCode,
          info: info,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'company_id,language_code',
        },
      );

      if (upsertError) throw upsertError;

      // Update cache entry and notify listeners
      if (entry) {
        entry.state.translations = {
          ...entry.state.translations,
          [languageCode]: info,
        };
        entry.listeners.forEach((l) => l(entry.state));
      }

      // sync local copy for current subscriber
      setLocal((prev) => ({
        ...prev,
        translations: {
          ...prev.translations,
          [languageCode]: info,
        },
      }));

      return true;
    } catch (err) {
      console.error('Error saving translation:', err);
      setLocal((prev) => ({ ...prev, error: err.message }));
      return false;
    }
  };

  // Delete a translation for a specific language
  const deleteTranslation = async (languageCode) => {
    if (!companyId) return;

    try {
      // clear any existing error on entry
      if (entry) entry.state.error = null;

      const { error: deleteError } = await supabase
        .from('company_translations')
        .delete()
        .eq('company_id', companyId)
        .eq('language_code', languageCode);

      if (deleteError) throw deleteError;

      // Update cache entry and notify listeners
      if (entry) {
        const updated = { ...entry.state.translations };
        delete updated[languageCode];
        entry.state.translations = updated;
        entry.listeners.forEach((l) => l(entry.state));
      }

      // sync local copy for current subscriber
      setLocal((prev) => {
        const updated = { ...prev.translations };
        delete updated[languageCode];
        return { ...prev, translations: updated };
      });

      return true;
    } catch (err) {
      console.error('Error deleting translation:', err);
      setLocal((prev) => ({ ...prev, error: err.message }));
      return false;
    }
  };

  // Get translation for a specific language with fallback
  const getTranslation = (languageCode, fallbackLanguage = 'nl') => {
    const t = local.translations || {};
    return t[languageCode] || t[fallbackLanguage] || '';
  };

  // Get available languages for this company
  const getAvailableLanguages = () => {
    return Object.keys(local.translations || {});
  };

  // component lifecycle for cache entry
  useEffect(() => {
    if (!companyId) return;
    const currentEntry = useCompanyTranslations.cache.get(companyId);
    if (!currentEntry) return; // unexpected but safe

    currentEntry.refCount += 1;
    const listener = (s) => setLocal({ ...s });
    currentEntry.listeners.add(listener);

    // sync state & trigger load if first subscriber
    setLocal({ ...currentEntry.state });
    if (currentEntry.refCount === 1) {
      loadTranslations();
    }

    return () => {
      currentEntry.listeners.delete(listener);
      currentEntry.refCount -= 1;
      if (currentEntry.refCount <= 0) {
        useCompanyTranslations.cache.delete(companyId);
      }
    };
  }, [companyId, loadTranslations]);

  return {
    translations: local.translations,
    loading: local.loading,
    error: local.error,
    saveTranslation,
    deleteTranslation,
    getTranslation,
    getAvailableLanguages,
    reload: loadTranslations,
  };
}
