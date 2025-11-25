import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

/**
 * useUserPreferences Hook
 *
 * Manages user-specific preferences stored in Supabase database.
 * Preferences sync across devices/browsers via real-time subscriptions.
 *
 * For device-specific settings (like sidebar collapsed state), continue using localStorage.
 *
 * @returns {Object} Hook state and methods
 * @property {Object|null} preferences - User preferences object or null if not loaded
 * @property {boolean} loading - Whether preferences are being loaded
 * @property {Function} updatePreference - Update a single preference
 * @property {Function} updatePreferences - Update multiple preferences at once
 * @property {Function} refreshPreferences - Manually refresh preferences from database
 */
export default function useUserPreferences() {
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);

  /**
   * Fetch user preferences from database
   */
  const fetchPreferences = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setPreferences(null);
        setLoading(false);
        return;
      }

      // Try to fetch existing preferences
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 is "not found" error, which is expected for new users
        console.error('Error fetching preferences:', error);
        setPreferences(null);
        setLoading(false);
        return;
      }

      // If no preferences exist, create defaults
      if (!data) {
        const currentYear = new Date().getFullYear();
        const defaults = {
          user_id: user.id,
          default_year: currentYear,
          preferred_language: 'nl',
          assignments_sort_by: 'alphabetic',
          assignments_sort_direction: 'asc',
          assignments_column_sort: 'markerId',
          assignments_column_sort_direction: 'asc',
          dashboard_visible_cards: ['stats', 'recent', 'actions'],
          default_rows_per_page: 25,
          email_notifications: true,
        };

        const { data: newPrefs, error: insertError } = await supabase
          .from('user_preferences')
          .insert(defaults)
          .select()
          .maybeSingle();

        if (insertError) {
          console.error('Error creating default preferences:', insertError);
          // Still set defaults locally even if insert fails
          setPreferences(defaults);
        } else {
          setPreferences(newPrefs);
        }
      } else {
        setPreferences(data);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error in fetchPreferences:', error);
      setPreferences(null);
      setLoading(false);
    }
  }, []);

  /**
   * Update a single preference
   * @param {string} key - Preference key to update
   * @param {any} value - New value for the preference
   * @returns {Promise<boolean>} Success status
   */
  const updatePreference = useCallback(async (key, value) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('Cannot update preference: No user logged in');
        return false;
      }

      const { data, error } = await supabase
        .from('user_preferences')
        .update({ [key]: value })
        .eq('user_id', user.id)
        .select()
        .maybeSingle();

      if (error) {
        console.error(`Error updating preference ${key}:`, error);
        return false;
      }

      if (data) {
        setPreferences(data);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error in updatePreference:', error);
      return false;
    }
  }, []);

  /**
   * Update multiple preferences at once
   * @param {Object} updates - Object with key-value pairs to update
   * @returns {Promise<boolean>} Success status
   */
  const updatePreferences = useCallback(async (updates) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('Cannot update preferences: No user logged in');
        return false;
      }

      const { data, error } = await supabase
        .from('user_preferences')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .maybeSingle();

      if (error) {
        console.error('Error updating preferences:', error);
        return false;
      }

      if (data) {
        setPreferences(data);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error in updatePreferences:', error);
      return false;
    }
  }, []);

  // Initial fetch on mount and set up real-time subscriptions
  useEffect(() => {
    let channel = null;
    let authListener = null;

    const setupSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Only set up subscription if table exists (check during fetch)
        // This prevents subscription errors when migrations haven't been run
        channel = supabase
          .channel('user-preferences-changes')
          .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'user_preferences',
            filter: `user_id=eq.${user.id}`
          }, (payload) => {
            console.log('User preferences updated from another tab/device:', payload);
            // Update local state when changes come from another tab/device
            setPreferences(payload.new);
          })
          .subscribe();
      }
    };

    // Initial fetch
    fetchPreferences().then(() => {
      // Set up subscription after initial fetch completes
      setupSubscription();
    });

    // Listen for auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        // User logged in - fetch preferences and set up subscription
        await fetchPreferences();

        // Clean up old subscription if it exists
        if (channel) {
          channel.unsubscribe();
          channel = null;
        }

        // Set up new subscription for this user
        await setupSubscription();
      } else {
        // User logged out - clean up
        setPreferences(null);
        setLoading(false);
        if (channel) {
          channel.unsubscribe();
          channel = null;
        }
      }
    });

    authListener = listener;

    return () => {
      authListener?.subscription?.unsubscribe();
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, [fetchPreferences]);

  return {
    preferences,
    loading,
    updatePreference,
    updatePreferences,
    refreshPreferences: fetchPreferences,
  };
}
