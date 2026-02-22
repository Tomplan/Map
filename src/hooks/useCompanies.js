import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabaseClient';
import normalizePhone from '../utils/phone';

/**
 * Hook to manage Companies data
 * Companies are permanent and reusable across years
 */
const defaultCache = {
  state: {
    companies: [],
    loading: true,
    error: null,
  },
  listeners: new Set(),
  refCount: 0,
  loadPromise: null,
  reloadTimeout: null,
};

// We use a property on the function to allow seeking/resetting for tests
// If it doesn't exist yet, initialize it
if (!useCompanies.cache) {
  useCompanies.cache = defaultCache;
}

/**
 * Companies are permanent and reusable across years
 */
export default function useCompanies() {
  // Ensure cache exists (in case it was cleared by tests or first run)
  if (!useCompanies.cache) {
    useCompanies.cache = {
      state: {
        companies: [],
        loading: true,
        error: null,
      },
      listeners: new Set(),
      refCount: 0,
      loadPromise: null,
      reloadTimeout: null,
    };
  }

  const entry = useCompanies.cache;

  const [local, setLocal] = useState({
    companies: entry.state.companies,
    loading: entry.state.loading,
    error: entry.state.error,
  });

  // Load all companies (updates cache entry)
  const loadCompanies = useCallback(async (isReload = false) => {
    // always grab the latest cache entry
    const e = useCompanies.cache;

    // if a load is already in progress return the existing promise
    if (e.loadPromise) {
      return e.loadPromise;
    }

    // if we already have data and we aren't explicitly asked to reload, skip
    if (e.state.companies.length > 0 && !e.state.loading && !isReload) {
      setLocal((prev) => {
        if (!prev.loading) return prev;
        return { ...prev, loading: false };
      });
      return Promise.resolve();
    }

    e.loadPromise = (async () => {
      try {
        if (e.reloadTimeout) {
          clearTimeout(e.reloadTimeout);
          e.reloadTimeout = null;
        }

        e.state.loading = true;
        e.state.error = null;

        const { data, error: fetchError } = await supabase
          .from('companies')
          .select('*')
          .order('name', { ascending: true });

        if (fetchError) throw fetchError;

        e.state.companies = data || [];
      } catch (err) {
        console.error('Error loading companies:', err);
        e.state.error = err.message;
      } finally {
        e.state.loading = false;
        e.listeners.forEach((l) => l(e.state));
        e.loadPromise = null;
      }
    })();

    return e.loadPromise;
  }, []);

  // Create new company
  const createCompany = useCallback(
    async (companyData) => {
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

        const newCompanies = [...entry.state.companies, data].sort((a, b) =>
          a.name.localeCompare(b.name),
        );
        entry.state.companies = newCompanies;
        entry.listeners.forEach((l) => l(entry.state));

        return { data, error: null };
      } catch (err) {
        console.error('Error creating company:', err);
        return { data: null, error: err.message };
      }
    },
    [entry],
  );

  // Update existing company
  const updateCompany = useCallback(
    async (id, updates) => {
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

        const newCompanies = entry.state.companies
          .map((c) => (c.id === id ? data : c))
          .sort((a, b) => a.name.localeCompare(b.name));
        entry.state.companies = newCompanies;
        entry.listeners.forEach((l) => l(entry.state));

        return { data, error: null };
      } catch (err) {
        console.error('Error updating company:', err);
        return { data: null, error: err.message };
      }
    },
    [entry],
  );

  // Delete company
  const deleteCompany = useCallback(
    async (id) => {
      try {
        const { error: deleteError } = await supabase.from('companies').delete().eq('id', id);

        if (deleteError) throw deleteError;

        const newCompanies = entry.state.companies.filter((c) => c.id !== id);
        entry.state.companies = newCompanies;
        entry.listeners.forEach((l) => l(entry.state));

        return { error: null };
      } catch (err) {
        console.error('Error deleting company:', err);
        return { error: err.message };
      }
    },
    [entry],
  );

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
    const listener = (s) => {
      setLocal({
        companies: s.companies,
        loading: s.loading,
        error: s.error,
      });
    };
    entry.listeners.add(listener);

    // sync immediately (check reference)
    // If cache has data, ensure we use it AND turn off loading
    if (entry.state.companies.length > 0) {
      setLocal({
        companies: entry.state.companies,
        loading: false,
        error: entry.state.error,
      });
    } else {
      setLocal((prev) => {
        if (prev.companies === entry.state.companies) return prev;
        return {
          companies: entry.state.companies,
          loading: entry.state.loading,
          error: entry.state.error,
        };
      });
    }

    // only trigger initial load if empty
    // IMPORTANT: Check against entry.refCount <= 1 to ensure we load on first ever mount
    // OR if we have 0 items.
    if (entry.state.companies.length === 0) {
      if (!entry.state.loading && !entry.loadPromise) {
        loadCompanies();
      } else if (entry.state.loading && !entry.loadPromise) {
        // It says loading:true but no promise? Stuck state. Restart.
        loadCompanies();
      } else if (entry.refCount === 1 && !entry.loadPromise) {
        // First mounter, kick it off
        loadCompanies();
      }
    }

    if (!entry.channel) {
      entry.channel = supabase
        .channel('companies-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'companies' }, () => {
          if (entry.reloadTimeout) clearTimeout(entry.reloadTimeout);
          entry.reloadTimeout = setTimeout(() => {
            loadCompanies(true);
          }, 500);
        })
        .subscribe();
    }

    return () => {
      entry.listeners.delete(listener);
      entry.refCount -= 1;
      // don't evict cache entry so that an in-flight load can finish and be
      // available to future subscribers; channels remain open indefinitely
      if (entry.reloadTimeout) clearTimeout(entry.reloadTimeout);
    };
  }, [entry, loadCompanies]);

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
