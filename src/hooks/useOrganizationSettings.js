import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

/**
 * useOrganizationSettings Hook
 *
 * Manages organization-wide settings (singleton table with id=1).
 * Settings are shared across all managers and public visitors.
 *
 * Use cases:
 * - Event meal defaults
 * - Visual branding (theme color, font family)
 * - Map configuration (center, zoom levels)
 * - Public visitor default year
 * - Notification preferences
 *
 * @returns {Object} Hook state and methods
 * @property {Object|null} settings - Organization settings object or null if not loaded
 * @property {boolean} loading - Whether settings are being loaded
 * @property {Function} updateSetting - Update a single setting
 * @property {Function} updateSettings - Update multiple settings at once
 * @property {Function} refreshSettings - Manually refresh settings from database
 */
export default function useOrganizationSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
   * Update a single organization setting
   * @param {string} key - Setting key to update
   * @param {any} value - New value for the setting
   * @returns {Promise<boolean>} Success status
   */
  const updateSetting = useCallback(async (key, value) => {
    try {
      // Check if user has permission to update settings
      // RLS policy enforces this, but we can provide better error messages
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('Cannot update setting: No user logged in');
        return false;
      }

      const { data, error: updateError } = await supabase
        .from('organization_settings')
        .update({ [key]: value })
        .eq('id', 1)
        .select()
        .maybeSingle();

      if (updateError) {
        console.error(`Error updating setting ${key}:`, updateError);
        // Check if it's a permission error
        if (updateError.code === 'PGRST301' || updateError.message?.includes('permission')) {
          console.error('Permission denied: User must be super_admin or system_manager to update organization settings');
        }
        return false;
      }

      if (data) {
        setSettings(data);
        return true;
      }

      return false;
    } catch (err) {
      console.error('Error in updateSetting:', err);
      return false;
    }
  }, []);

  /**
   * Update multiple organization settings at once
   * @param {Object} updates - Object with key-value pairs to update
   * @returns {Promise<boolean>} Success status
   */
  const updateSettings = useCallback(async (updates) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('Cannot update settings: No user logged in');
        return false;
      }

      const { data, error: updateError } = await supabase
        .from('organization_settings')
        .update(updates)
        .eq('id', 1)
        .select()
        .maybeSingle();

      if (updateError) {
        console.error('Error updating settings:', updateError);
        if (updateError.code === 'PGRST301' || updateError.message?.includes('permission')) {
          console.error('Permission denied: User must be super_admin or system_manager to update organization settings');
        }
        return false;
      }

      if (data) {
        setSettings(data);
        return true;
      }

      return false;
    } catch (err) {
      console.error('Error in updateSettings:', err);
      return false;
    }
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    fetchSettings();

    // Only subscribe to real-time changes if settings loaded successfully
    // This prevents connection loops if table doesn't exist
    let channel = null;

    // Wait a bit to see if settings load successfully
    const subscribeTimer = setTimeout(() => {
      // Only set up subscription if we have settings (table exists)
      if (settings !== null || error === null) {
        channel = supabase
          .channel('organization-settings-changes')
          .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'organization_settings',
            filter: 'id=eq.1'
          }, (payload) => {
            console.log('Organization settings updated:', payload);
            setSettings(payload.new);
          })
          .subscribe();
      }
    }, 1000);

    return () => {
      clearTimeout(subscribeTimer);
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, [fetchSettings]);

  return {
    settings,
    loading,
    error,
    updateSetting,
    updateSettings,
    refreshSettings: fetchSettings,
  };
}
