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
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categoryStats, setCategoryStats] = useState({});

  // Load categories with translations
  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch categories with their translations
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

      // Transform data to include localized fields
      const transformed = categoriesData.map((cat) => {
        const translation =
          cat.category_translations.find((t) => t.language === language) ||
          cat.category_translations.find((t) => t.language === 'nl') ||
          cat.category_translations[0];

        return {
          id: cat.id,
          slug: cat.slug,
          icon: ICON_MAP[cat.icon] || mdiDotsHorizontal, // Convert string to icon path
          iconName: cat.icon, // Keep original for admin editing
          color: cat.color,
          sort_order: cat.sort_order,
          active: cat.active,
          name: translation?.name || cat.slug,
          description: translation?.description || '',
          translations: cat.category_translations,
        };
      });

      // Avoid unnecessary re-renders by checking if the transformed data changed
      setCategories((prev) => {
        const prevStr = JSON.stringify(prev || []);
        const nextStr = JSON.stringify(transformed || []);
        if (prevStr !== nextStr) return transformed;
        return prev;
      });
    } catch (err) {
      console.error('Error loading categories:', err);
      setError(err.message);
      // If table doesn't exist, set empty array
      if (err.message?.includes('does not exist') || err.code === '42P01') {
        console.warn('Categories table not found. Please run migration 007.');
        setCategories([]);
      }
    } finally {
      setLoading(false);
    }
  }, [language]);

  // Initial load
  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

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
      // Only set if changed to avoid re-render loops
      setCategoryStats((prev) => {
        const prevStr = JSON.stringify(prev || {});
        const nextStr = JSON.stringify(stats || {});
        if (prevStr !== nextStr) return stats;
        return prev;
      });
      return stats;
    } catch (err) {
      console.error('Error loading category stats:', err);
      setCategoryStats({});
      return {};
    }
  }, []);

  useEffect(() => {
    let channel = null;
    if (typeof navigator !== 'undefined' ? navigator.onLine : true) {
      channel = supabase
        .channel('categories-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () =>
          loadCategories(),
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'category_translations' },
          () => loadCategories(),
        )
        .on('postgres_changes', { event: '*', schema: 'public', table: 'company_categories' }, () =>
          loadCategoryStats(),
        )
        .subscribe();
    }

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [loadCategories, loadCategoryStats]);

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

  useEffect(() => {
    // Initial load for category stats
    loadCategoryStats();
  }, [loadCategoryStats]);

  return {
    categories,
    loading,
    error,
    createCategory,
    updateCategory,
    deleteCategory,
    getCompanyCategories,
    getAllCompanyCategories,
    assignCategoriesToCompany,
    getCategoryStats,
    categoryStats,
    refetch: loadCategories,
  };
}

export default useCategories;
