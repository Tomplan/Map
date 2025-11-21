import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

/**
 * Hook to manage Companies data
 * Companies are permanent and reusable across years
 */
export default function useCompanies() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load all companies
  const loadCompanies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('companies')
        .select('*')
        .order('name', { ascending: true });

      if (fetchError) throw fetchError;

      setCompanies(data || []);
    } catch (err) {
      console.error('Error loading companies:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create new company
  const createCompany = useCallback(async (companyData) => {
    try {
      const { data, error: insertError } = await supabase
        .from('companies')
        .insert([companyData])
        .select()
        .single();

      if (insertError) throw insertError;

      setCompanies((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      return { data, error: null };
    } catch (err) {
      console.error('Error creating company:', err);
      return { data: null, error: err.message };
    }
  }, []);

  // Update existing company
  const updateCompany = useCallback(async (id, updates) => {
    try {
      const { data, error: updateError } = await supabase
        .from('companies')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      setCompanies((prev) =>
        prev.map((c) => (c.id === id ? data : c)).sort((a, b) => a.name.localeCompare(b.name))
      );
      return { data, error: null };
    } catch (err) {
      console.error('Error updating company:', err);
      return { data: null, error: err.message };
    }
  }, []);

  // Delete company
  const deleteCompany = useCallback(async (id) => {
    try {
      const { error: deleteError } = await supabase.from('companies').delete().eq('id', id);

      if (deleteError) throw deleteError;

      setCompanies((prev) => prev.filter((c) => c.id !== id));
      return { error: null };
    } catch (err) {
      console.error('Error deleting company:', err);
      return { error: err.message };
    }
  }, []);

  // Search companies by name
  const searchCompanies = useCallback(
    (searchTerm) => {
      if (!searchTerm) return companies;
      const term = searchTerm.toLowerCase();
      return companies.filter((c) => c.name?.toLowerCase().includes(term));
    },
    [companies]
  );

  // Initial load
  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  // Subscribe to realtime changes
  useEffect(() => {
    const channel = supabase
      .channel('companies-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'companies' }, () => {
        loadCompanies(); // Reload on any change
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadCompanies]);

  return {
    companies,
    loading,
    error,
    createCompany,
    updateCompany,
    deleteCompany,
    searchCompanies,
    reload: loadCompanies,
  };
}
