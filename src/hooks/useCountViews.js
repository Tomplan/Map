import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

/*
Shared in-memory cache + single realtime subscription per (baseTable,eventYear).
- Prevents duplicate REST queries and duplicate Supabase realtime channels when
  multiple components/hooks request the same counts.
- Cache entries are reference-counted and removed when no subscribers remain.
*/
const _countCache = new Map();

function _getKey(viewTable, year) {
  return `${viewTable}:${year}`;
}

function _ensureCacheEntry(viewTable, year) {
  const key = _getKey(viewTable, year);
  if (_countCache.has(key)) return _countCache.get(key);

  const entry = {
    state: { count: 0, loading: true, error: null },
    listeners: new Set(),
    refCount: 0,
    channel: null,
    fetchPromise: null,
  };
  _countCache.set(key, entry);
  return entry;
}

async function _fetchCount(viewTable, year, entry) {
  if (entry.fetchPromise) return entry.fetchPromise;

  entry.fetchPromise = (async () => {
    try {
      const baseQuery = supabase.from(viewTable).select('count').eq('event_year', year);
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
      console.error(`Error loading ${viewTable} count for ${year}:`, err);
      if (entry.state.loading) {
        entry.state.count = 0;
      }
      entry.state.error = err?.message || String(err);
    } finally {
      entry.state.loading = false;
      entry.fetchPromise = null;
      entry.listeners.forEach((l) => l(entry.state));
    }
  })();

  return entry.fetchPromise;
}

function _startRealtimeChannel(viewTable, baseTable, year, entry) {
  if (entry.channel) return;

  const channelName = `${baseTable}-count-${year}`;
  entry.channel = supabase
    .channel(channelName)
    .on('postgres_changes', { event: '*', schema: 'public', table: baseTable }, (payload) => {
      // For DELETE events without REPLICA IDENTITY FULL, payload.old might only contain the ID
      // and lack the event_year. So to be safe, we just refetch the count anytime the base 
      // table changes. It's a very fast query.
      _fetchCount(viewTable, year, entry);
    })
    .subscribe();
}

function _stopCacheEntry(viewTable, year) {
  const key = _getKey(viewTable, year);
  const entry = _countCache.get(key);
  if (!entry) return;
  if (entry.channel) supabase.removeChannel(entry.channel);
  _countCache.delete(key);
}

function _createCountHook(viewTable, baseTable) {
  return function useCount(eventYear) {
    const [localState, setLocalState] = useState({ count: 0, loading: true, error: null });

    useEffect(() => {
      if (eventYear == null || Number.isNaN(Number(eventYear))) {
        setLocalState({ count: 0, loading: false, error: null });
        return undefined;
      }

      const entry = _ensureCacheEntry(viewTable, eventYear);
      entry.refCount += 1;

      const listener = (s) => setLocalState({ ...s });
      entry.listeners.add(listener);

      setLocalState({ ...entry.state });

      if (entry.state.loading) {
        _fetchCount(viewTable, eventYear, entry);
      }

      _startRealtimeChannel(viewTable, baseTable, eventYear, entry);

      return () => {
        entry.listeners.delete(listener);
        entry.refCount -= 1;
        if (entry.refCount <= 0) {
          _stopCacheEntry(viewTable, eventYear);
        }
      };
    }, [eventYear]);

    return localState;
  };
}

export const useSubscriptionCount = _createCountHook('subscription_counts', 'event_subscriptions');
export const useAssignmentCount = _createCountHook('assignment_counts', 'assignments');
export const useMarkerCount = _createCountHook('marker_counts', 'markers_core');

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
          table: 'companies',
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
