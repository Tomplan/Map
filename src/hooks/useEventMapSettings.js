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
export default function useEventMapSettings(eventYear) {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Fetch event map settings for the specified year
   */
  const fetchSettings = useCallback(async () => {
    if (!eventYear) {
      setSettings(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('event_map_settings')
        .select('*')
        .eq('event_year', eventYear)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 is "not found" which is OK
        console.error('Error fetching event map settings:', fetchError);
        setError(fetchError.message);
        setSettings(null);
      } else {
        setSettings(data); // Will be null if no event-specific settings exist
        setError(null);
      }
    } catch (err) {
      console.error('Error in fetchSettings:', err);
      setError(err.message);
      setSettings(null);
    } finally {
      setLoading(false);
    }
  }, [eventYear]);

  /**
   * Update or create event map settings for the specified year
   * @param {Object} updates - Settings to update
   * @returns {Promise<boolean>} Success status
   */
  const updateSettings = useCallback(
    async (updates) => {
      if (!eventYear) {
        console.error('Cannot update settings: No event year specified');
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

        // Check if settings already exist for this year
        const existingSettings = settings;

        if (existingSettings) {
          // Update existing settings
          const { data, error: updateError } = await supabase
            .from('event_map_settings')
            .update({
              ...updates,
              updated_by: user.id,
            })
            .eq('event_year', eventYear)
            .select()
            .single();

          if (updateError) {
            console.error('Error updating event map settings:', updateError);
            throw new Error(updateError.message);
          }

          setSettings(data);
        } else {
          // Create new settings for this year
          const { data, error: insertError } = await supabase
            .from('event_map_settings')
            .insert([
              {
                event_year: eventYear,
                ...updates,
                created_by: user.id,
                updated_by: user.id,
              },
            ])
            .select()
            .single();

          if (insertError) {
            console.error('Error creating event map settings:', insertError);
            throw new Error(insertError.message);
          }

          setSettings(data);
        }

        return true;
      } catch (error) {
        console.error('Error in updateSettings:', error);
        throw error;
      }
    },
    [eventYear, settings],
  );

  /**
   * Reset event settings to use global defaults (delete event-specific settings)
   * @returns {Promise<boolean>} Success status
   */
  const resetToGlobal = useCallback(async () => {
    if (!eventYear) {
      console.error('Cannot reset settings: No event year specified');
      return false;
    }

    try {
      const { error: deleteError } = await supabase
        .from('event_map_settings')
        .delete()
        .eq('event_year', eventYear);

      if (deleteError) {
        console.error('Error resetting event map settings:', deleteError);
        throw new Error(deleteError.message);
      }

      setSettings(null); // Now will use global defaults
      return true;
    } catch (error) {
      console.error('Error in resetToGlobal:', error);
      throw error;
    }
  }, [eventYear]);

  // Fetch settings when eventYear changes
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return {
    settings,
    loading,
    error,
    updateSettings,
    resetToGlobal,
    refetch: fetchSettings,
  };
}
