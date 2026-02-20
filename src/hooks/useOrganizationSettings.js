import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabaseClient';

/**
 * useOrganizationSettings Hook
 *
 * Manages organization-wide settings (singleton table with id=1) with cross-admin synchronization.
 * Settings are shared across all managers and public visitors.
 *
 * ARCHITECTURE:
 * - Singleton pattern: Only one settings row exists (id=1)
 * - Optimistic concurrency control prevents data loss from concurrent admin edits
 * - Real-time subscriptions sync changes across all admin sessions
 *
 * IMPLEMENTATION PATTERN:
 * - Uses row_version column for optimistic locking
 * - Detects conflicts when multiple admins update simultaneously
 * - Auto-reloads on conflict, throws user-friendly error
 * - Version checking in realtime prevents race conditions
 *
 * OPTIMISTIC CONCURRENCY:
 * When updating, we:
 *   1. Read current row_version
 *   2. Increment it and write with WHERE row_version = old_value
 *   3. If no rows updated, another admin changed it first
 *   4. Reload fresh data and ask admin to retry
 *
 * USE CASES:
 * - Event meal defaults
 * - Visual branding (theme color, font family)
 * - Map configuration (center, zoom levels)
 * - Public visitor default year
 * - Notification preferences
 *
 * @returns {Object} Hook state and methods
 * @property {Object|null} settings - Organization settings object or null if not loaded
 * @property {boolean} loading - Whether settings are being loaded
 * @property {Function} updateSetting - Update a single setting with conflict detection
 * @property {Function} updateSettings - Update multiple settings at once with conflict detection
 * @property {Function} refreshSettings - Manually refresh settings from database
 */
const useOrgSettingsCache = {
  // Use a simple object as a singleton cache
  // This persists across unmounts/remounts
  state: {
    settings: null,
    loading: true,
    error: null,
  },
  listeners: new Set(),
  refCount: 0,
  loadPromise: null,
  channel: null,
};

export default function useOrganizationSettings() {
  const entry = useOrgSettingsCache;

  const [local, setLocal] = useState({
    settings: entry.state.settings,
    loading: entry.state.loading,
    error: entry.state.error,
  });

  /**
   * Fetch organization settings from database
   */
  const fetchSettings = useCallback(async (isReload = false) => {
    // If we already have data and aren't forcing a reload, return early
    if (entry.state.settings && !entry.state.loading && !isReload) {
        if (local.loading) {
            setLocal((prev) => ({ ...prev, loading: false }));
        }
        return;
    }

    // prevent parallel fetches
    if (entry.loadPromise) return entry.loadPromise;

    entry.state.loading = true;
    entry.state.error = null;
    entry.listeners.forEach((l) => l(entry.state));

    entry.loadPromise = (async () => {
    try {
      // Fetch the singleton settings row (id=1)
      const { data, error: fetchError } = await supabase
        .from('organization_settings')
        .select('*')
        .eq('id', 1)
        .maybeSingle();

      if (fetchError) {
        // Handle case where table doesn't exist yet (migrations not run)
        if (fetchError.code === '42P01' || fetchError.message?.includes('does not exist')) {
          console.warn('organization_settings table does not exist. Run migrations 25 & 26.');
          entry.state.settings = null;
          entry.state.error = null; // Don't treat as error, just not initialized
        } else {
            console.error('Error fetching organization settings:', fetchError);
            entry.state.error = fetchError.message;
            entry.state.settings = null;
        }
      } else if (!data) {
        // This should never happen (migration 25 creates the row)
        console.warn(
          'Organization settings row not found (id=1). Database migration may not have run.',
        );
        entry.state.settings = null;
        entry.state.error = null; // Don't treat as error, app should still work with defaults
      } else {
          entry.state.settings = data;
          entry.state.error = null;
      }
    } catch (err) {
      console.error('Error in fetchSettings:', err);
      entry.state.error = err.message;
      entry.state.settings = null;
    } finally {
      entry.state.loading = false;
      entry.listeners.forEach((l) => l(entry.state));
      entry.loadPromise = null;
    }
    })();
    return entry.loadPromise;
  }, []);



  /**
   * Update multiple organization settings at once with optimistic concurrency control
   */
  const updateSettings = useCallback(
    async (updates) => {
      // Use local state or entry state? Local state is fine as it's synced.
      if (!local.settings) {
        console.error('Cannot update settings: Settings not loaded');
        return false;
      }

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          console.error('Cannot update settings: No user logged in');
          return false;
        }

        const currentVersion = local.settings.row_version || 0;

        // Optimistic concurrency: increment version and check old version matches
        const { data, error: updateError } = await supabase
          .from('organization_settings')
          .update({
            ...updates,
            row_version: currentVersion + 1,
            updated_by: user.id,
          })
          .eq('id', 1)
          .eq('row_version', currentVersion) // Only update if version matches
          .select()
          .single();

        if (updateError) {
          // Check if it's a permission error
          if (updateError.code === 'PGRST301' || updateError.message?.includes('permission')) {
            throw new Error(
              'Permission denied. Only super_admin or system_manager can update organization settings.',
            );
          }
          console.error('Error updating settings:', updateError);
          throw new Error(updateError.message || 'Failed to update organization settings');
        }

        if (!data) {
          // No rows updated = conflict detected
          await fetchSettings(true); // reload forced
          throw new Error('Organization settings were updated by another admin. Please try again.');
        }

        entry.state.settings = data;
        entry.listeners.forEach((l) => l(entry.state));
        return true;
      } catch (error) {
        console.error('Error in updateSettings:', error);
        throw error;
      }
    },
    [local.settings, fetchSettings],
  );

  // Helper for single update
  const updateSetting = useCallback(async (key, value) => {
      return updateSettings({ [key]: value });
  }, [updateSettings]);

  // Initial fetch on mount
  useEffect(() => {
    // Register listener
    entry.refCount += 1;
    // console.log('useOrganizationSettings mount. RefCount:', entry.refCount, 'Loading:', entry.state.loading, 'Settings:', !!entry.state.settings);

    const listener = (s) => setLocal({ ...s });
    entry.listeners.add(listener);

    // Sync state immediately on mount
    // If we have data in cache, force loading=false to show it immediately
    if (entry.state.settings) {
         setLocal({ ...entry.state, loading: false });
    } else if (local.loading !== entry.state.loading || local.settings !== entry.state.settings) {
        setLocal({ ...entry.state });
    }

    // Trigger fetch if:
    // 1. We have no settings (initial load)
    // 2. OR we are loading but no promise is active (stuck state)
    // 3. We ignore refCount logic here because if we are mounting and don't have data, we want it.
    if (!entry.state.settings && !entry.loadPromise) {
        fetchSettings();
    }

    // Setup channel if missing
    if (!entry.channel) {
         entry.channel = supabase
          .channel('organization-settings-changes')
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'organization_settings',
              filter: 'id=eq.1',
            },
            (payload) => {
              const currentVersion = entry.state.settings?.row_version || 0;
              // Only apply update if newer version
              if (payload.new.row_version > currentVersion) {
                entry.state.settings = payload.new;
                entry.listeners.forEach(l => l(entry.state));
              }
            },
          )
          .subscribe();
    }

    return () => {
        entry.listeners.delete(listener);
        entry.refCount -= 1;
        if (entry.refCount <= 0 && entry.channel) {
            supabase.removeChannel(entry.channel);
            entry.channel = null;
            // useOrgSettingsCache.state.settings = null; // KEEP CACHE
        }
    };
  }, [fetchSettings]); // Dependencies

  return {
    settings: local.settings,
    loading: local.loading,
    error: local.error,
    updateSetting,
    updateSettings,
    refreshSettings: () => fetchSettings(true),
  };
}
