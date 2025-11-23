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
  mdiDotsHorizontal
} from '@mdi/js';

// Map icon names to actual icon paths
const ICON_MAP = {
  'mdiCarOutline': mdiCarOutline,
  'mdiTent': mdiTent,
  'mdiTrailer': mdiTruckTrailer,
  'mdiCarCog': mdiCarCog,
  'mdiAirplane': mdiAirplane,
  'mdiHomeCity': mdiHomeCity,
  'mdiAccountGroup': mdiAccountGroup,
  'mdiTerrainIcon': mdiTerrain,
  'mdiCellphone': mdiCellphone,
  'mdiDotsHorizontal': mdiDotsHorizontal
};

/**
 * Custom hook for managing categories with translations
 * Provides CRUD operations and real-time updates
 */
export function useCategories(language = 'nl') {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load categories with translations
  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch categories with their translations
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select(`
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
        `)
        .eq('active', true)
        .order('sort_order');

      if (categoriesError) throw categoriesError;

      // Transform data to include localized fields
      const transformed = categoriesData.map(cat => {
        const translation = cat.category_translations.find(t => t.language === language) ||
                          cat.category_translations.find(t => t.language === 'nl') ||
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
          translations: cat.category_translations
        };
      });

      setCategories(transformed);
    } catch (err) {
      console.error('Error loading categories:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [language]);

  // Initial load
  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('categories-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'categories' },
        () => loadCategories()
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'category_translations' },
        () => loadCategories()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadCategories]);

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
          sort_order: categoryData.sort_order || 0
        })
        .select()
        .single();

      if (categoryError) throw categoryError;

      // Insert translations
      const translations = Object.entries(categoryData.translations || {}).map(([lang, trans]) => ({
        category_id: category.id,
        language: lang,
        name: trans.name,
        description: trans.description || null
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
          active: updates.active
        })
        .eq('id', categoryId);

      if (categoryError) throw categoryError;

      // Update translations if provided
      if (updates.translations) {
        for (const [lang, trans] of Object.entries(updates.translations)) {
          const { error: transError } = await supabase
            .from('category_translations')
            .upsert({
              category_id: categoryId,
              language: lang,
              name: trans.name,
              description: trans.description || null
            }, {
              onConflict: 'category_id,language'
            });

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
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;

      await loadCategories();
      return { success: true };
    } catch (err) {
      console.error('Error deleting category:', err);
      return { success: false, error: err.message };
    }
  };

  // Get company categories
  const getCompanyCategories = async (companyId) => {
    try {
      const { data, error } = await supabase
        .from('company_categories')
        .select(`
          category_id,
          categories(
            id,
            slug,
            icon,
            color,
            category_translations(language, name)
          )
        `)
        .eq('company_id', companyId);

      if (error) throw error;

      return data.map(cc => {
        const cat = cc.categories;
        const translation = cat.category_translations.find(t => t.language === language) ||
                          cat.category_translations[0];
        return {
          id: cat.id,
          slug: cat.slug,
          icon: cat.icon,
          color: cat.color,
          name: translation?.name || cat.slug
        };
      });
    } catch (err) {
      console.error('Error fetching company categories:', err);
      return [];
    }
  };

  // Assign categories to company
  const assignCategoriesToCompany = async (companyId, categoryIds) => {
    try {
      // Remove existing assignments
      await supabase
        .from('company_categories')
        .delete()
        .eq('company_id', companyId);

      // Add new assignments
      if (categoryIds.length > 0) {
        const assignments = categoryIds.map(categoryId => ({
          company_id: companyId,
          category_id: categoryId
        }));

        const { error } = await supabase
          .from('company_categories')
          .insert(assignments);

        if (error) throw error;
      }

      return { success: true };
    } catch (err) {
      console.error('Error assigning categories:', err);
      return { success: false, error: err.message };
    }
  };

  // Get category statistics
  const getCategoryStats = async () => {
    try {
      const { data, error } = await supabase
        .from('company_categories')
        .select('category_id, categories(slug, category_translations(language, name))');

      if (error) throw error;

      const stats = {};
      data.forEach(cc => {
        const slug = cc.categories.slug;
        if (!stats[slug]) {
          const translation = cc.categories.category_translations.find(t => t.language === language) ||
                            cc.categories.category_translations[0];
          stats[slug] = {
            name: translation?.name || slug,
            count: 0
          };
        }
        stats[slug].count++;
      });

      return stats;
    } catch (err) {
      console.error('Error fetching category stats:', err);
      return {};
    }
  };

  return {
    categories,
    loading,
    error,
    createCategory,
    updateCategory,
    deleteCategory,
    getCompanyCategories,
    assignCategoriesToCompany,
    getCategoryStats,
    refetch: loadCategories
  };
}

export default useCategories;
