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
export default function useOrganizationSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const channelRef = useRef(null);

  /**
   * Fetch organization settings from database
   */
  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);

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
          setSettings(null);
          setError(null); // Don't treat as error, just not initialized
          setLoading(false);
          return;
        }

        console.error('Error fetching organization settings:', fetchError);
        setError(fetchError.message);
        setSettings(null);
        setLoading(false);
        return;
      }

      if (!data) {
        // This should never happen (migration 25 creates the row)
        console.warn('Organization settings row not found (id=1). Database migration may not have run.');
        setSettings(null);
        setError(null); // Don't treat as error, app should still work with defaults
        setLoading(false);
        return;
      }

      setSettings(data);
      setError(null);
      setLoading(false);
    } catch (err) {
      console.error('Error in fetchSettings:', err);
      setError(err.message);
      setSettings(null);
      setLoading(false);
    }
  }, []);

  /**
   * Update a single organization setting with optimistic concurrency control
   * @param {string} key - Setting key to update
   * @param {any} value - New value for the setting
   * @returns {Promise<boolean>} Success status
   * @throws {Error} If conflict detected (another admin updated first)
   */
  const updateSetting = useCallback(async (key, value) => {
    if (!settings) {
      console.error('Cannot update setting: Settings not loaded');
      return false;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('Cannot update setting: No user logged in');
        return false;
      }

      const currentVersion = settings.row_version || 0;

      // Optimistic concurrency: increment version and check old version matches
      const { data, error: updateError } = await supabase
        .from('organization_settings')
        .update({
          [key]: value,
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
          throw new Error('Permission denied. Only super_admin or system_manager can update organization settings.');
        }
        console.error(`Error updating setting ${key}:`, updateError);
        return false;
      }

      if (!data) {
        // No rows updated = conflict detected
        await fetchSettings();
        throw new Error('Organization settings were updated by another admin. Please try again.');
      }

      setSettings(data);
      return true;
    } catch (error) {
      console.error('Error in updateSetting:', error);
      throw error;
    }
  }, [settings, fetchSettings]);

  /**
   * Update multiple organization settings at once with optimistic concurrency control
   * @param {Object} updates - Object with key-value pairs to update
   * @returns {Promise<boolean>} Success status
   * @throws {Error} If conflict detected (another admin updated first)
   */
  const updateSettings = useCallback(async (updates) => {
    if (!settings) {
      console.error('Cannot update settings: Settings not loaded');
      return false;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('Cannot update settings: No user logged in');
        return false;
      }

      const currentVersion = settings.row_version || 0;

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
          throw new Error('Permission denied. Only super_admin or system_manager can update organization settings.');
        }
        console.error('Error updating settings:', updateError);
        return false;
      }

      if (!data) {
        // No rows updated = conflict detected
        await fetchSettings();
        throw new Error('Organization settings were updated by another admin. Please try again.');
      }

      setSettings(data);
      return true;
    } catch (error) {
      console.error('Error in updateSettings:', error);
      throw error;
    }
  }, [settings, fetchSettings]);

  // Initial fetch on mount
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Set up real-time subscription for cross-admin sync
  useEffect(() => {
    if (!settings) return;

    // Clean up existing subscription
    if (channelRef.current) {
      channelRef.current.unsubscribe();
      channelRef.current = null;
    }

    // Subscribe to settings changes with version checking
    channelRef.current = supabase
      .channel('organization-settings-changes')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'organization_settings',
        filter: 'id=eq.1'
      }, (payload) => {
        // Only apply update if newer version (prevents race conditions)
        if (payload.new.row_version > (settings.row_version || 0)) {
          setSettings(payload.new);
        }
      })
      .subscribe();

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
    };
  }, [settings?.row_version]);

  return {
    settings,
    loading,
    error,
    updateSetting,
    updateSettings,
    refreshSettings: fetchSettings,
  };
}
