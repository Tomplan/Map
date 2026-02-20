import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

/**
 * Hook to load booth markers with their glyph text from Markers_Core and Markers_Appearance tables.
 * Returns markers with id and glyph properties.
 *
 * @param {number} [selectedYear] - Optional year parameter to trigger reload when changed
 * @returns {{ markers: Array<{id: number, glyph: string}>, loading: boolean, error: Error | null }}
 */
/*
  Cached marker glyphs hook
  - Dedupes REST requests and subscribes once per table/year
  - Reference-counted listeners so multiple components reuse same data
*/
const _glyphsCache = new Map();

function _glyphKey(year) {
  return `markerGlyphs:${year}`;
}

function _ensureGlyphsEntry(year) {
  const key = _glyphKey(year);
  if (_glyphsCache.has(key)) return _glyphsCache.get(key);

  const entry = {
    state: { markers: [], loading: true, error: null },
    listeners: new Set(),
    refCount: 0,
    channels: [],
    loadPromise: null,
  };
  _glyphsCache.set(key, entry);
  return entry;
}

async function _loadInitialGlyphs(year, entry) {
  if (entry.loadPromise) return entry.loadPromise;

  entry.loadPromise = (async () => {
    try {
      entry.state.loading = true;
      // Fetch core ids and appearance glyphs in parallel
      const [coreRes, appearanceRes] = await Promise.all([
        supabase
          .from('markers_core')
          .select('id')
          .lt('id', 1000)
          .eq('event_year', year)
          .order('id', { ascending: true }),
        supabase
          .from('markers_appearance')
          .select('id, glyph')
          .lt('id', 1000)
          .eq('event_year', year),
      ]);

      if (coreRes.error) throw coreRes.error;
      if (appearanceRes.error) throw appearanceRes.error;

      const glyphMap = {};
      (appearanceRes.data || []).forEach((r) => {
        if (r && r.id) glyphMap[r.id] = r.glyph || '';
      });

      const merged = (coreRes.data || []).map((m) => ({
        id: m.id,
        glyph: glyphMap[m.id] || String(m.id),
      }));

      entry.state.markers = merged;
      entry.state.error = null;
    } catch (err) {
      console.error('Error loading marker glyphs for', year, err);
      entry.state.markers = [];
      entry.state.error = err?.message || String(err);
    } finally {
      entry.state.loading = false;
      entry.listeners.forEach((l) => l(entry.state));
    }
  })();

  return entry.loadPromise;
}

function _startGlyphsChannels(year, entry) {
  if (entry.channels && entry.channels.length > 0) return;

  const coreChannel = supabase
    .channel(`markers-core-glyphs-${year}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'markers_core', filter: `event_year=eq.${year}` },
      () => _loadInitialGlyphs(year, entry),
    )
    .subscribe();

  const appearanceChannel = supabase
    .channel(`markers-appearance-glyphs-${year}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'markers_appearance',
        filter: `event_year=eq.${year}`,
      },
      () => _loadInitialGlyphs(year, entry),
    )
    .subscribe();

  entry.channels = [coreChannel, appearanceChannel];
}

function _stopGlyphsEntry(year) {
  const key = _glyphKey(year);
  const entry = _glyphsCache.get(key);
  if (!entry) return;

  // if (entry.refCount <= 0) { // Check passed in earlier
  for (const ch of entry.channels || []) supabase.removeChannel(ch);
  entry.channels = []; // Clear channels so they restart on next mount
  // }
}

export function useMarkerGlyphs(selectedYear) {
  const [local, setLocal] = useState({ markers: [], loading: true, error: null });

  useEffect(() => {
    if (!selectedYear) {
      setLocal({ markers: [], loading: false, error: null });
      return undefined;
    }

    // Check if cache entry exists
    const key = _glyphKey(selectedYear);
    let entry = _glyphsCache.get(key);

    // Create entry if missing
    if (!entry) {
      entry = {
        state: { markers: [], loading: true, error: null },
        listeners: new Set(),
        refCount: 0,
        channels: [],
        loadPromise: null,
      };
      _glyphsCache.set(key, entry);
    } else {
      // If entry exists, use its state immediately (even if old)
      // Loading state should reflect if we are actively fetching or have data
      // If we have data, we might not want to show loading: true
    }

    entry.refCount += 1;

    const listener = (s) => setLocal({ ...s });
    entry.listeners.add(listener);

    // Sync efficiently - use state from entry
    setLocal({ ...entry.state });

    // Only load if explicitly loading (fresh entry) or valid refresh needed?
    // Actually, if we have data, we probably don't need to reload immediately unless channels are gone?
    // Channels being gone means we might be stale.
    // So let's restart channels.

    if (entry.state.loading && !entry.loadPromise) {
      _loadInitialGlyphs(selectedYear, entry);
    }

    // Always start channels if missing (they are cleared on unmount)
    if (!entry.channels || entry.channels.length === 0) {
      _startGlyphsChannels(selectedYear, entry);
    }

    return () => {
      entry.listeners.delete(listener);
      entry.refCount -= 1;
      if (entry.refCount <= 0) {
        _stopGlyphsEntry(selectedYear);
      }
    };
  }, [selectedYear]);

  return { markers: local.markers, loading: local.loading, error: local.error };
}
