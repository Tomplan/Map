import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import normalizePhone from '../utils/phone';

/**
 * A hook to manage the organization's profile data.
 * It fetches, updates, and subscribes to real-time changes for the single-row organization_profile table.
 * Note: Uses 'logo' field to match companies table structure.
 */
/*
  Cached singleton hook for organization_profile
  - Shared in-memory cache ensures only one REST query & realtime channel
  - Reference-counted listener set so multiple consumers share state
*/
const _orgCacheEntry = {
  state: { profile: null, loading: true, error: null },
  listeners: new Set(),
  refCount: 0,
  channel: null,
  loadPromise: null,
};

async function _loadInitialProfile(entry) {
  if (entry.loadPromise) return entry.loadPromise;

  entry.loadPromise = (async () => {
    try {
      const { data, error } = await supabase.from('organization_profile').select('*').single();
      if (error) {
        if (error.code === 'PGRST116') {
          console.warn(
            'No organization profile found. A default one should be created by the migration.',
          );
          entry.state.profile = null;
        } else {
          throw error;
        }
      } else {
        entry.state.profile = data;
      }
      entry.state.error = null;
    } catch (err) {
      console.error('Error fetching organization profile:', err);
      entry.state.error = err.message;
      entry.state.profile = null;
    } finally {
      entry.state.loading = false;
      entry.listeners.forEach((l) => l(entry.state));
    }
  })();

  return entry.loadPromise;
}

function _startOrgChannel(entry) {
  if (entry.channel) return;
  entry.channel = supabase
    .channel('organization-profile')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'organization_profile', filter: 'id=eq.1' },
      (payload) => {
        if (payload.new) {
          entry.state.profile = payload.new;
          entry.listeners.forEach((l) => l(entry.state));
        }
      },
    )
    .subscribe();
}

function _stopOrgEntry() {
  if (_orgCacheEntry.channel) supabase.removeChannel(_orgCacheEntry.channel);
  // reset state for safety (in case of next subscription)
  _orgCacheEntry.state = { profile: null, loading: true, error: null };
}

export default function useOrganizationProfile() {
  const [local, setLocal] = useState({ profile: null, loading: true, error: null });

  useEffect(() => {
    const entry = _orgCacheEntry;
    entry.refCount += 1;
    const listener = (s) => setLocal({ ...s });
    entry.listeners.add(listener);

    setLocal({ ...entry.state });
    if (entry.state.loading) _loadInitialProfile(entry);
    _startOrgChannel(entry);

    return () => {
      entry.listeners.delete(listener);
      entry.refCount -= 1;
      if (entry.refCount <= 0) {
        _stopOrgEntry();
      }
    };
  }, []);

  /**
   * Updates the organization profile.
   * @param {object} updates - An object containing the fields to update.
   */
  const updateProfile = async (updates) => {
    try {
      // Normalize phone number when provided
      if (updates?.phone || updates?.phone === '') updates.phone = normalizePhone(updates.phone);
      // Normalize email to lowercase
      if (updates?.email) updates.email = updates.email.toLowerCase().trim();

      const { data, error } = await supabase
        .from('organization_profile')
        .update(updates)
        .eq('id', 1) // Always update the singleton row
        .select()
        .single();

      if (error) throw error;

      // update cache state so all listeners see it immediately
      const entry = _orgCacheEntry;
      entry.state.profile = data;
      entry.listeners.forEach((l) => l(entry.state));

      return { data, error: null };
    } catch (err) {
      console.error('Error updating organization profile:', err);
      return { data: null, error: err.message };
    }
  };

  return { profile: local.profile, loading: local.loading, error: local.error, updateProfile };
}
