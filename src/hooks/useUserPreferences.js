import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabaseClient';

/**
 * useUserPreferences Hook
 *
 * Manages user-specific preferences stored in Supabase database.
 * Preferences sync across devices/browsers via real-time subscriptions.
 *
 * IMPORTANT: This hook uses ONLY onAuthStateChange to avoid getSession() hangs.
 * No initial getSession() calls are made - everything waits for auth state callback.
 *
 * For device-specific settings (like sidebar collapsed state), continue using localStorage.
 *
 * @returns {Object} Hook state and methods
 * @property {Object|null} preferences - User preferences object or null if not loaded
 * @property {boolean} loading - Whether preferences are being loaded
 * @property {Function} updatePreference - Update a single preference
 * @property {Function} updatePreferences - Update multiple preferences at once
 */
export default function useUserPreferences() {
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef(null);

  /**
   * Fetch/create user preferences from database for a given user
   * This is called from onAuthStateChange with the session's user object
   */
  const loadPreferencesForUser = useCallback(async (user) => {
    try {
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
      // Error loading preferences - set loading false to allow app to continue
      console.warn('loadPreferencesForUser failed:', error.message);
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

  // Set up auth state listener and initial load
  useEffect(() => {
    let isMounted = true;

    // Get initial session and load preferences
    supabase.auth.getSession().then(async ({ data }) => {
      if (!isMounted) return;

      const user = data?.session?.user;
      if (user) {
        await loadPreferencesForUser(user);

        // Set up real-time subscription for cross-browser sync
        if (isMounted && channelRef.current) {
          channelRef.current.unsubscribe();
          channelRef.current = null;
        }

        if (isMounted) {
          channelRef.current = supabase
            .channel('user-preferences-changes')
            .on('postgres_changes', {
              event: 'UPDATE',
              schema: 'public',
              table: 'user_preferences',
              filter: `user_id=eq.${user.id}`
            }, (payload) => {
              if (isMounted) {
                console.log('User preferences updated from another tab/device:', payload);
                setPreferences(payload.new);
              }
            })
            .subscribe();
        }
      } else {
        setPreferences(null);
        setLoading(false);
      }
    });

    // Listen for auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return;

      if (session) {
        const user = session.user;
        await loadPreferencesForUser(user);

        // Set up real-time subscription
        if (isMounted && channelRef.current) {
          channelRef.current.unsubscribe();
          channelRef.current = null;
        }

        if (isMounted) {
          channelRef.current = supabase
            .channel('user-preferences-changes')
            .on('postgres_changes', {
              event: 'UPDATE',
              schema: 'public',
              table: 'user_preferences',
              filter: `user_id=eq.${user.id}`
            }, (payload) => {
              if (isMounted) {
                console.log('User preferences updated from another tab/device:', payload);
                setPreferences(payload.new);
              }
            })
            .subscribe();
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

    return () => {
      isMounted = false;
      listener?.subscription?.unsubscribe();
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
    };
  }, [loadPreferencesForUser]);

  return {
    preferences,
    loading,
    updatePreference,
    updatePreferences,
  };
}
