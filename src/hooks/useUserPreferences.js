import { useState, useEffect, useCallback, useRef } from 'react';
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
  const channelRef = useRef(null);

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

      // Handle errors (including table not existing)
      if (error) {
        if (error.code === 'PGRST116') {
          // No preferences found - this is okay, we'll create them
        } else if (error.code === '42P01' || error.message?.includes('does not exist')) {
          // Table doesn't exist (migrations not run)
          console.warn('user_preferences table does not exist. Run migration 24.');
          setPreferences(null);
          setLoading(false);
          return;
        } else {
          // Other error
          console.error('Error fetching preferences:', error);
          setPreferences(null);
          setLoading(false);
          return;
        }
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
          // Table might not exist, or other insert error
          if (insertError.code === '42P01' || insertError.message?.includes('does not exist')) {
            console.warn('Cannot create preferences: table does not exist. Run migration 24.');
          } else {
            console.error('Error creating default preferences:', insertError);
          }
          // Set preferences to null and continue - app will work with localStorage
          setPreferences(null);
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
    let authListener = null;

    const setupSubscription = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return;

        // Don't set up subscription if preferences is null (table doesn't exist)
        // Check the current preferences state to see if table exists
        if (preferences === null) {
          console.log('Skipping subscription setup: user_preferences table may not exist');
          return;
        }

        // Clean up existing subscription before creating new one
        if (channelRef.current) {
          channelRef.current.unsubscribe();
          channelRef.current = null;
        }

        // Set up real-time subscription for cross-browser sync
        channelRef.current = supabase
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
      } catch (error) {
        console.error('Error setting up subscription:', error);
      }
    };

    // Initial fetch with error handling
    fetchPreferences()
      .then(() => {
        // Set up subscription after initial fetch completes
        setupSubscription();
      })
      .catch((error) => {
        console.error('Error during initial fetch:', error);
        setLoading(false);
      });

    // Listen for auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        // User logged in - fetch preferences and set up subscription
        try {
          await fetchPreferences();
          await setupSubscription();
        } catch (error) {
          console.error('Error during login fetch:', error);
          setLoading(false);
        }
      } else {
        // User logged out - clean up
        setPreferences(null);
        setLoading(false);
        if (channelRef.current) {
          channelRef.current.unsubscribe();
          channelRef.current = null;
        }
      }
    });

    authListener = listener;

    return () => {
      authListener?.subscription?.unsubscribe();
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
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
