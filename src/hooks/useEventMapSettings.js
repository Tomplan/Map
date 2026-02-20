import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

/**
 * useEventMapSettings Hook
 *
 * Manages year-specific map configuration settings with fallback to global organization settings.
 * Provides CRUD operations for event map settings.
 *
 * @param {number} eventYear - The event year to manage settings for
 * @returns {Object} Hook state and methods
 * @property {Object|null} settings - Event-specific map settings or null if not loaded
 * @property {boolean} loading - Whether settings are being loaded
 * @property {Function} updateSettings - Update map settings for the event year
 * @property {Function} resetToGlobal - Reset event settings to use global defaults
 */
/*
  Cached version of useEventMapSettings
  - Shared in-memory cache per event year
  - Single Supabase realtime subscription per year
  - Reference-counted listeners so multiple components/hook instances reuse the same network work
*/
const _settingsCache = new Map();

function _getKey(year) {
  return `event_map_settings:${year}`;
}

function _ensureCacheEntry(year) {
  const key = _getKey(year);
  if (_settingsCache.has(key)) return _settingsCache.get(key);

  const entry = {
    state: { settings: null, loading: true, error: null },
    listeners: new Set(),
    refCount: 0,
    channel: null,
    loadPromise: null,
  };
  _settingsCache.set(key, entry);
  return entry;
}

async function _loadInitialSettings(year, entry) {
  if (entry.loadPromise) return entry.loadPromise;

  entry.loadPromise = (async () => {
    try {
      const { data, error } = await supabase
        .from('event_map_settings')
        .select('*')
        .eq('event_year', year)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        entry.state.settings = null;
        entry.state.error = error.message || String(error);
      } else {
        entry.state.settings = data || null;
        entry.state.error = null;
      }
    } catch (err) {
      console.error('Error loading event_map_settings for', year, err);
      entry.state.settings = null;
      entry.state.error = err?.message || String(err);
    } finally {
      entry.state.loading = false;
      entry.listeners.forEach((l) => l(entry.state));
    }
  })();

  return entry.loadPromise;
}

function _startRealtimeChannel(year, entry) {
  if (entry.channel) return;
  const channelName = `event-map-settings-${year}`;
  entry.channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'event_map_settings',
        filter: `event_year=eq.${year}`,
      },
      () => {
        // reload cache on any change for this year
        _loadInitialSettings(year, entry);
      },
    )
    .subscribe();
}

function _stopCacheEntry(year) {
  const key = _getKey(year);
  const entry = _settingsCache.get(key);
  if (!entry) return;
  if (entry.channel) supabase.removeChannel(entry.channel);
  _settingsCache.delete(key);
}

export default function useEventMapSettings(eventYear) {
  const [local, setLocal] = useState({ settings: null, loading: true, error: null });

  useEffect(() => {
    if (!eventYear) {
      setLocal({ settings: null, loading: false, error: null });
      return undefined;
    }

    const entry = _ensureCacheEntry(eventYear);
    entry.refCount += 1;

    const listener = (s) => setLocal({ ...s });
    entry.listeners.add(listener);

    // sync immediate state
    setLocal({ ...entry.state });

    // kick off initial load if needed
    if (entry.state.loading) _loadInitialSettings(eventYear, entry);

    // ensure single realtime subscription
    _startRealtimeChannel(eventYear, entry);

    return () => {
      entry.listeners.delete(listener);
      entry.refCount -= 1;
      if (entry.refCount <= 0) {
        _stopCacheEntry(eventYear);
      }
    };
  }, [eventYear]);

  // updateSettings / resetToGlobal should update cache so all listeners see changes
  const updateSettings = useCallback(
    async (updates) => {
      if (!eventYear) {
        console.error('Cannot update settings: No event year specified');
        return false;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        console.error('Cannot update settings: No user logged in');
        return false;
      }

      try {
        // use upsert to simplify create-or-update semantics
        const { data, error } = await supabase
          .from('event_map_settings')
          .upsert([{ event_year: eventYear, ...updates, updated_by: user.id }], {
            onConflict: 'event_year',
          })
          .select()
          .maybeSingle();

        if (error) throw error;

        const entry = _ensureCacheEntry(eventYear);
        entry.state.settings = data || null;
        entry.state.loading = false;
        entry.state.error = null;
        entry.listeners.forEach((l) => l(entry.state));
        return true;
      } catch (err) {
        console.error('Error updating event_map_settings:', err);
        throw err;
      }
    },
    [eventYear],
  );

  const resetToGlobal = useCallback(async () => {
    if (!eventYear) return false;
    try {
      const { error } = await supabase
        .from('event_map_settings')
        .delete()
        .eq('event_year', eventYear);
      if (error) throw error;
      const entry = _ensureCacheEntry(eventYear);
      entry.state.settings = null;
      entry.state.error = null;
      entry.state.loading = false;
      entry.listeners.forEach((l) => l(entry.state));
      return true;
    } catch (err) {
      console.error('Error resetting event_map_settings:', err);
      throw err;
    }
  }, [eventYear]);

  const refetch = useCallback(() => {
    if (!eventYear) return Promise.resolve();
    const entry = _ensureCacheEntry(eventYear);
    return _loadInitialSettings(eventYear, entry);
  }, [eventYear]);

  return {
    settings: local.settings,
    loading: local.loading,
    error: local.error,
    updateSettings,
    resetToGlobal,
    refetch,
  };
}
