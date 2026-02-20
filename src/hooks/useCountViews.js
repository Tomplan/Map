import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

/*
Shared in-memory cache + single realtime subscription per (table,eventYear).
- Prevents duplicate REST queries and duplicate Supabase realtime channels when
  multiple components/hooks request the same counts.
- Cache entries are reference-counted and removed when no subscribers remain.
*/
const _countCache = new Map();

function _getKey(table, year) {
  return `${table}:${year}`;
}

function _ensureCacheEntry(table, year) {
  const key = _getKey(table, year);
  if (_countCache.has(key)) return _countCache.get(key);

  const entry = {
    state: { count: 0, loading: true, error: null },
    listeners: new Set(),
    refCount: 0,
    channel: null,
    loadPromise: null,
  };
  _countCache.set(key, entry);
  return entry;
}

async function _loadInitialCount(table, year, entry) {
  if (entry.loadPromise) return entry.loadPromise;

  entry.loadPromise = (async () => {
    try {
      const baseQuery = supabase.from(table).select('count').eq('event_year', year);
      let res;
      if (baseQuery && typeof baseQuery.maybeSingle === 'function') {
        res = await baseQuery.maybeSingle();
      } else if (baseQuery && typeof baseQuery.single === 'function') {
        res = await baseQuery.single();
      } else {
        res = await baseQuery;
      }

      const { data, error } = res || {};
      if (error) throw error;
      entry.state.count = data?.count || 0;
      entry.state.error = null;
    } catch (err) {
      console.error(`Error loading ${table} count for ${year}:`, err);
      entry.state.count = 0;
      entry.state.error = err?.message || String(err);
    } finally {
      entry.state.loading = false;
      // notify listeners
      entry.listeners.forEach((l) => l(entry.state));
    }
  })();

  return entry.loadPromise;
}

function _startRealtimeChannel(table, year, entry) {
  if (entry.channel) return;

  const channelName = `${table}-count-${year}`;
  entry.channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table },
      (payload) => {
        const isRelevant = (payload.new && payload.new.event_year === year) ||
          (payload.old && payload.old.event_year === year);
        if (!isRelevant) return;

        if (payload.new) {
          entry.state.count = payload.new.count;
        } else if (payload.eventType === 'DELETE') {
          entry.state.count = 0;
        }
        entry.listeners.forEach((l) => l(entry.state));
      },
    )
    .subscribe();
}

function _stopCacheEntry(table, year) {
  const key = _getKey(table, year);
  const entry = _countCache.get(key);
  if (!entry) return;
  if (entry.channel) supabase.removeChannel(entry.channel);
  _countCache.delete(key);
}

function _createCountHook(table) {
  return function useCount(eventYear) {
    const [localState, setLocalState] = useState({ count: 0, loading: true, error: null });

    useEffect(() => {
      // Guard invalid year
      if (eventYear == null || Number.isNaN(Number(eventYear))) {
        setLocalState({ count: 0, loading: false, error: null });
        return undefined;
      }

      const entry = _ensureCacheEntry(table, eventYear);
      entry.refCount += 1;

      // listener will update local hook state when cache changes
      const listener = (s) => setLocalState({ ...s });
      entry.listeners.add(listener);

      // Sync immediate state from cache
      setLocalState({ ...entry.state });

      // Kick off initial load (only once per cache entry)
      if (entry.state.loading) {
        _loadInitialCount(table, eventYear, entry);
      }

      // Ensure single realtime subscription per cache entry
      _startRealtimeChannel(table, eventYear, entry);

      return () => {
        entry.listeners.delete(listener);
        entry.refCount -= 1;
        if (entry.refCount <= 0) {
          _stopCacheEntry(table, eventYear);
        }
      };
    }, [eventYear]);

    return localState;
  };
}

export const useSubscriptionCount = _createCountHook('subscription_counts');
export const useAssignmentCount = _createCountHook('assignment_counts');
export const useMarkerCount = _createCountHook('marker_counts');


/**
 * Hook for total company count (not year-specific)
 * @returns {object} { count, loading, error }
 */
export function useCompanyCount() {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Load initial count
    const loadCount = async () => {
      try {
        setLoading(true);
        const baseQuery = supabase.from('company_counts').select('count');
        let res;
        if (baseQuery && typeof baseQuery.maybeSingle === 'function') {
          res = await baseQuery.maybeSingle();
        } else if (baseQuery && typeof baseQuery.single === 'function') {
          res = await baseQuery.single();
        } else {
          res = await baseQuery;
        }

        const { data, error } = res || {};
        if (error) throw error;
        setCount(data?.count || 0);
      } catch (err) {
        console.error('Error loading company count:', err);
        setError(err.message);
        setCount(0);
      } finally {
        setLoading(false);
      }
    };

    loadCount();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('company-count')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'company_counts',
        },
        (payload) => {
          // Reload count when view changes
          loadCount();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { count, loading, error };
}
