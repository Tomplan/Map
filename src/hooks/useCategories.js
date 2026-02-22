import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import {
  mdiCarOutline,
  mdiTent,
  mdiTruckTrailer,
  mdiCarCog,
  mdiAirplane,
  mdiHomeCity,
  mdiAccountGroup,
  mdiTerrain,
  mdiCellphone,
  mdiDotsHorizontal,
} from '@mdi/js';

// Map icon names to actual icon paths
const ICON_MAP = {
  mdiCarOutline: mdiCarOutline,
  mdiTent: mdiTent,
  mdiTrailer: mdiTruckTrailer,
  mdiCarCog: mdiCarCog,
  mdiAirplane: mdiAirplane,
  mdiHomeCity: mdiHomeCity,
  mdiAccountGroup: mdiAccountGroup,
  mdiTerrainIcon: mdiTerrain,
  mdiCellphone: mdiCellphone,
  mdiDotsHorizontal: mdiDotsHorizontal,
};

/**
 * Custom hook for managing categories with translations
 * Provides CRUD operations and real-time updates
 */
export function useCategories(language = 'nl') {
  // cache keyed by language string
  const key = language || 'nl';
  const entryKey = `categories:${key}`;
  // ensure cache entry exists
  if (!useCategories.cache) {
    useCategories.cache = new Map();
  }
  if (!useCategories.cache.has(entryKey)) {
    useCategories.cache.set(entryKey, {
      state: { categories: [], loading: true, error: null, categoryStats: {} },
      listeners: new Set(),
      refCount: 0,
      channel: null,
      statsChannel: null,
      loadPromise: null,
      statsLoadPromise: null,
    });
  }

  const entry = useCategories.cache.get(entryKey);
  // local state mirrors cache state
  const [local, setLocal] = useState({
    categories: entry.state.categories,
    loading: entry.state.loading,
    error: entry.state.error,
    categoryStats: entry.state.categoryStats,
  });

  // Load categories with translations (updates cache entry)
  const loadCategories = useCallback(
    async (isReload = false) => {
      // If we already have data and aren't forcing a reload, return early
      if (entry.state.categories.length > 0 && !entry.state.loading && !isReload) {
        setLocal((prev) => {
          if (!prev.loading) return prev;
          return { ...prev, loading: false };
        });
        return;
      }

      try {
        // don't call external set* helpers; update entry directly
        entry.state.loading = true;
        entry.state.error = null;

        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select(
            `
          id,
          slug,
          icon,
          color,
          sort_order,
          active,
          category_translations(
            language,
            name,
            description
          )
        `,
          )
          .eq('active', true)
          .order('sort_order');

        if (categoriesError) throw categoriesError;

        const transformed = (categoriesData || []).map((cat) => {
          const translation =
            cat.category_translations.find((t) => t.language === language) ||
            cat.category_translations.find((t) => t.language === 'nl') ||
            cat.category_translations[0];

          return {
            id: cat.id,
            slug: cat.slug,
            icon: ICON_MAP[cat.icon] || mdiDotsHorizontal,
            iconName: cat.icon,
            color: cat.color,
            sort_order: cat.sort_order,
            active: cat.active,
            name: translation?.name || cat.slug,
            description: translation?.description || '',
            translations: cat.category_translations,
          };
        });

        entry.state.categories = transformed;
        entry.state.error = null;
      } catch (err) {
        console.error('Error loading categories:', err);
        entry.state.error = err.message;
        if (err.message?.includes('does not exist') || err.code === '42P01') {
          console.warn('Categories table not found. Please run migration 007.');
          entry.state.categories = [];
        }
      } finally {
        entry.state.loading = false;
        // notify listeners
        entry.listeners.forEach((l) => l(entry.state));
      }
    },
    [language, entry],
  );

  // Real-time subscription
  // Dedicated loader for category stats (used by subscription)
  const loadCategoryStats = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('company_categories').select('category_id');
      if (error) throw error;
      const stats = {};
      data.forEach((cc) => {
        if (!stats[cc.category_id]) stats[cc.category_id] = 0;
        stats[cc.category_id]++;
      });
      entry.state.categoryStats = stats;
      entry.listeners.forEach((l) => l(entry.state));
      return stats;
    } catch (err) {
      console.error('Error loading category stats:', err);
      entry.state.categoryStats = {};
      entry.listeners.forEach((l) => l(entry.state));
      return {};
    }
  }, [entry]);

  // effect that ties the hook instance into the shared cache entry
  useEffect(() => {
    entry.refCount += 1;
    const listener = (s) =>
      setLocal({
        categories: s.categories,
        loading: s.loading,
        error: s.error,
        categoryStats: s.categoryStats,
      });
    entry.listeners.add(listener);

    // sync state immediately
    setLocal((prev) => {
      // Avoid re-render if state is already identical
      if (
        prev.categories === entry.state.categories &&
        prev.loading === entry.state.loading &&
        prev.error === entry.state.error &&
        prev.categoryStats === entry.state.categoryStats
      ) {
        return prev;
      }
      return {
        categories: entry.state.categories,
        loading: entry.state.loading,
        error: entry.state.error,
        categoryStats: entry.state.categoryStats,
      };
    });

    // only trigger initial load once per cache entry
    if (entry.state.loading && entry.refCount === 1) {
      loadCategories();
    }

    // start channels only once per entry
    if (!entry.channel) {
      entry.channel = supabase
        .channel('categories-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () =>
          loadCategories(),
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'category_translations' },
          () => loadCategories(),
        )
        .subscribe();
    }
    if (!entry.statsChannel) {
      entry.statsChannel = supabase
        .channel('company-categories-stats')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'company_categories' }, () =>
          loadCategoryStats(),
        )
        .subscribe();
    }

    return () => {
      entry.listeners.delete(listener);
      entry.refCount -= 1;

      // Cleanup channels if no one is listening, but KEEP the data
      // This is crucial for avoiding page flickers/loading states on navigation
      if (entry.refCount <= 0) {
        if (entry.channel) {
          supabase.removeChannel(entry.channel);
          entry.channel = null;
        }
        if (entry.statsChannel) {
          supabase.removeChannel(entry.statsChannel);
          entry.statsChannel = null;
        }
        // Do NOT delete the cache entry
      }
    };
  }, [entryKey, entry, loadCategories, loadCategoryStats]);

  // Create category with translations
  const createCategory = async (categoryData) => {
    try {
      // Insert category
      const { data: category, error: categoryError } = await supabase
        .from('categories')
        .insert({
          slug: categoryData.slug,
          icon: categoryData.icon,
          color: categoryData.color,
          sort_order: categoryData.sort_order || 0,
        })
        .select()
        .single();

      if (categoryError) throw categoryError;

      // Insert translations
      const translations = Object.entries(categoryData.translations || {}).map(([lang, trans]) => ({
        category_id: category.id,
        language: lang,
        name: trans.name,
        description: trans.description || null,
      }));

      if (translations.length > 0) {
        const { error: translationsError } = await supabase
          .from('category_translations')
          .insert(translations);

        if (translationsError) throw translationsError;
      }

      await loadCategories();
      return { success: true, data: category };
    } catch (err) {
      console.error('Error creating category:', err);
      return { success: false, error: err.message };
    }
  };

  // Update category
  const updateCategory = async (categoryId, updates) => {
    try {
      const { error: categoryError } = await supabase
        .from('categories')
        .update({
          slug: updates.slug,
          icon: updates.icon,
          color: updates.color,
          sort_order: updates.sort_order,
          active: updates.active,
        })
        .eq('id', categoryId);

      if (categoryError) throw categoryError;

      // Update translations if provided
      if (updates.translations) {
        for (const [lang, trans] of Object.entries(updates.translations)) {
          const { error: transError } = await supabase.from('category_translations').upsert(
            {
              category_id: categoryId,
              language: lang,
              name: trans.name,
              description: trans.description || null,
            },
            {
              onConflict: 'category_id,language',
            },
          );

          if (transError) throw transError;
        }
      }

      await loadCategories();
      return { success: true };
    } catch (err) {
      console.error('Error updating category:', err);
      return { success: false, error: err.message };
    }
  };

  // Delete category
  const deleteCategory = async (categoryId) => {
    try {
      const { error } = await supabase.from('categories').delete().eq('id', categoryId);

      if (error) throw error;

      await loadCategories();
      return { success: true };
    } catch (err) {
      console.error('Error deleting category:', err);
      return { success: false, error: err.message };
    }
  };

  // Get company categories
  const getCompanyCategories = useCallback(
    async (companyId) => {
      try {
        const { data, error } = await supabase
          .from('company_categories')
          .select(
            `
          category_id,
          categories(
            id,
            slug,
            icon,
            color,
            category_translations(language, name)
          )
        `,
          )
          .eq('company_id', companyId);

        if (error) throw error;

        return data.map((cc) => {
          const cat = cc.categories;
          const translation =
            cat.category_translations.find((t) => t.language === language) ||
            cat.category_translations[0];
          return {
            id: cat.id,
            slug: cat.slug,
            icon: ICON_MAP[cat.icon] || mdiDotsHorizontal,
            iconName: cat.icon,
            color: cat.color,
            name: translation?.name || cat.slug,
          };
        });
      } catch (err) {
        console.error('Error fetching company categories:', err);
        return [];
      }
    },
    [language],
  );

  // Get all company categories in one query (optimized for bulk loading)
  const getAllCompanyCategories = useCallback(
    async (companyIds) => {
      try {
        const { data, error } = await supabase
          .from('company_categories')
          .select(
            `
          company_id,
          category_id,
          categories(
            id,
            slug,
            icon,
            color,
            category_translations(language, name)
          )
        `,
          )
          .in('company_id', companyIds);

        if (error) throw error;

        // Group by company_id
        const grouped = {};
        data.forEach((cc) => {
          if (!grouped[cc.company_id]) {
            grouped[cc.company_id] = [];
          }
          const cat = cc.categories;
          const translation =
            cat.category_translations.find((t) => t.language === language) ||
            cat.category_translations[0];
          grouped[cc.company_id].push({
            id: cat.id,
            slug: cat.slug,
            icon: ICON_MAP[cat.icon] || mdiDotsHorizontal,
            iconName: cat.icon,
            color: cat.color,
            name: translation?.name || cat.slug,
          });
        });

        return grouped;
      } catch (err) {
        console.error('Error fetching all company categories:', err);
        return {};
      }
    },
    [language],
  );

  // Assign categories to company
  const assignCategoriesToCompany = async (companyId, categoryIds) => {
    try {
      // Remove existing assignments
      await supabase.from('company_categories').delete().eq('company_id', companyId);

      // Add new assignments
      if (categoryIds.length > 0) {
        const assignments = categoryIds.map((categoryId) => ({
          company_id: companyId,
          category_id: categoryId,
        }));

        const { error } = await supabase.from('company_categories').insert(assignments);

        if (error) throw error;
      }

      return { success: true };
    } catch (err) {
      console.error('Error assigning categories:', err);
      return { success: false, error: err.message };
    }
  };

  // Get category statistics (indexed by category_id)
  const getCategoryStats = async () => {
    try {
      const { data, error } = await supabase.from('company_categories').select('category_id');

      if (error) throw error;

      // Count occurrences by category_id
      const stats = {};
      data.forEach((cc) => {
        if (!stats[cc.category_id]) {
          stats[cc.category_id] = 0;
        }
        stats[cc.category_id]++;
      });

      // set to central state so other consumers can subscribe via hook
      setCategoryStats(stats);
      return stats;
    } catch (err) {
      console.error('Error fetching category stats:', err);
      return {};
    }
  };

  return {
    categories: local.categories,
    loading: local.loading,
    error: local.error,
    createCategory,
    updateCategory,
    deleteCategory,
    getCompanyCategories,
    getAllCompanyCategories,
    assignCategoriesToCompany,
    getCategoryStats,
    categoryStats: local.categoryStats,
    refetch: loadCategories,
  };
}

export default useCategories;
