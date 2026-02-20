import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabaseClient';
import normalizePhone from '../utils/phone';

/**
 * Hook to manage Companies data
 * Companies are permanent and reusable across years
 */
export default function useCompanies() {
  // shared cache entry (singleton)
  if (!useCompanies.cache) {
    useCompanies.cache = {
      state: { companies: [], loading: true, error: null },
      listeners: new Set(),
      refCount: 0,
      channel: null,
      reloadTimeout: null,
      loadPromise: null,
    };
  }
  const entry = useCompanies.cache;

  const [local, setLocal] = useState({
    companies: entry.state.companies,
    loading: entry.state.loading,
    error: entry.state.error,
  });

  // Load all companies (updates cache entry)
  const loadCompanies = useCallback(async () => {
    try {
      // Clear any pending debounced reload
      if (entry.reloadTimeout) {
        clearTimeout(entry.reloadTimeout);
        entry.reloadTimeout = null;
      }

      entry.state.loading = true;
      entry.state.error = null;

      const { data, error: fetchError } = await supabase
        .from('companies')
        .select('*')
        .order('name', { ascending: true });

      if (fetchError) throw fetchError;

      entry.state.companies = data || [];
    } catch (err) {
      console.error('Error loading companies:', err);
      entry.state.error = err.message;
    } finally {
      entry.state.loading = false;
      entry.listeners.forEach((l) => l(entry.state));
    }
  }, []);

  // Create new company
  const createCompany = useCallback(async (companyData) => {
    try {
      // Normalize phone number when provided
      if (companyData?.phone) companyData.phone = normalizePhone(companyData.phone);
      // Normalize email to lowercase
      if (companyData?.email) companyData.email = companyData.email.toLowerCase().trim();
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
      // Normalize phone number when provided
      if (updates?.phone || updates?.phone === '') updates.phone = normalizePhone(updates.phone);
      // Normalize email to lowercase
      if (updates?.email) updates.email = updates.email.toLowerCase().trim();
      const { data, error: updateError } = await supabase
        .from('companies')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      setCompanies((prev) =>
        prev.map((c) => (c.id === id ? data : c)).sort((a, b) => a.name.localeCompare(b.name)),
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
      const list = local.companies || [];
      if (!searchTerm) return list;
      const term = searchTerm.toLowerCase();
      return list.filter((c) => c.name?.toLowerCase().includes(term));
    },
    [local],
  );


  // Subscribe to realtime changes (debounced to batch multiple rapid changes)
  useEffect(() => {
    entry.refCount += 1;
    const listener = (s) => setLocal({
      companies: s.companies,
      loading: s.loading,
      error: s.error,
    });
    entry.listeners.add(listener);

    // sync immediately
    setLocal({
      companies: entry.state.companies,
      loading: entry.state.loading,
      error: entry.state.error,
    });
    if (entry.state.loading && entry.refCount === 1) {
      loadCompanies();
    }

    if (!entry.channel) {
      entry.channel = supabase
        .channel('companies-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'companies' }, () => {
          if (entry.reloadTimeout) clearTimeout(entry.reloadTimeout);
          entry.reloadTimeout = setTimeout(() => {
            loadCompanies();
          }, 500);
        })
        .subscribe();
    }

    return () => {
      entry.listeners.delete(listener);
      entry.refCount -= 1;
      if (entry.refCount <= 0) {
        if (entry.channel) supabase.removeChannel(entry.channel);
        useCompanies.cache = null;
      }
      if (entry.reloadTimeout) clearTimeout(entry.reloadTimeout);
    };
  }, [loadCompanies]);

  return {
    companies: local.companies,
    loading: local.loading,
    error: local.error,
    createCompany,
    updateCompany,
    deleteCompany,
    searchCompanies,
    reload: loadCompanies,
  };
}
