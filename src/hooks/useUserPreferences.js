import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabaseClient';

/**
 * useUserPreferences Hook
 *
 * Manages user-specific preferences stored in Supabase database with cross-device synchronization.
 *
 * ARCHITECTURE:
 * - Single source of truth: Database is authoritative, localStorage is cache
 * - Optimistic concurrency control prevents data loss from concurrent edits
 * - Real-time subscriptions sync changes across all user sessions
 *
 * IMPLEMENTATION PATTERN:
 * - Follows official Supabase React pattern (getSession + onAuthStateChange, no timeout)
 * - Uses row_version column for optimistic locking
 * - Detects conflicts when multiple devices update simultaneously
 * - Auto-reloads on conflict, throws user-friendly error
 * - Version checking in realtime prevents race conditions
 *
 * OPTIMISTIC CONCURRENCY:
 * When updating, we:
 *   1. Read current row_version
 *   2. Increment it and write with WHERE row_version = old_value
 *   3. If no rows updated, another device changed it first
 *   4. Reload fresh data and ask user to retry
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
  const [userId, setUserId] = useState(null);
  const channelRef = useRef(null);
  const currentVersionRef = useRef(0);
  const isUpdatingRef = useRef(false);
  const lastUpdateTimeRef = useRef(0);

  /**
   * Load user preferences from database
   * Creates default preferences if none exist
   */
  const loadPreferences = useCallback(async (user) => {
    if (!user) {
      setPreferences(null);
      setLoading(false);
      setUserId(null);
      return;
    }

    try {
      setUserId(user.id);

      // Fetch existing preferences (official pattern - no timeout)
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        // Error other than "not found"
        console.error('Error fetching preferences:', error);
        setPreferences(null);
        setLoading(false);
        return;
      }

      // If no preferences exist, create defaults
      if (!data) {
        const currentYear = new Date().getFullYear();

        // Check if user selected language on login page (stored in localStorage)
        const storedLanguage = localStorage.getItem('preferredLanguage');
        const preferredLanguage = storedLanguage || 'nl'; // Default to 'nl' if not set

        const defaults = {
          user_id: user.id,
          default_year: currentYear,
          preferred_language: preferredLanguage,
          assignments_sort_by: 'alphabetic',
          assignments_sort_direction: 'asc',
          // Default to human-friendly label/glyph sorting for assignments columns
          assignments_column_sort: 'glyph_text',
          assignments_column_sort_direction: 'asc',
          dashboard_visible_cards: ['stats', 'recent', 'actions'],
          default_rows_per_page: 25,
          email_notifications: true,
          feedback_active_tab: 'all',
          feedback_filter_types: [],
          feedback_filter_statuses: [],
          row_version: 1,
          updated_by: user.id,
        };

        const { data: newPrefs, error: insertError } = await supabase
          .from('user_preferences')
          .insert(defaults)
          .select()
          .single();

        if (insertError) {
          console.error('Error creating default preferences:', insertError);
          setPreferences(null);
        } else {
          currentVersionRef.current = newPrefs.row_version;
          setPreferences(newPrefs);
        }
      } else {
        currentVersionRef.current = data.row_version;
        setPreferences(data);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading preferences:', error);
      setPreferences(null);
      setLoading(false);
    }
  }, []);

  /**
   * Update a single preference with optimistic concurrency control and retry on conflict
   * @param {string} key - Preference key to update
   * @param {any} value - New value for the preference
   * @param {number} retryCount - Internal: number of retries attempted (max 3)
   * @returns {Promise<boolean>} Success status
   * @throws {Error} If conflict persists after retries
   */
  const updatePreference = useCallback(
    async (key, value, retryCount = 0) => {
      if (!userId) {
        console.error('Cannot update preference: No user logged in');
        return false;
      }

      // Prevent concurrent updates and add cooldown
      const now = Date.now();
      if (isUpdatingRef.current || now - lastUpdateTimeRef.current < 1000) {
        return false;
      }

      try {
        isUpdatingRef.current = true;
        // Fetch current preferences to get the latest row_version
        const { data: currentPrefs, error: fetchError } = await supabase
          .from('user_preferences')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (fetchError) {
          console.error('Error fetching current preferences:', fetchError);
          return false;
        }

        const currentVersion = currentPrefs?.row_version || 0;

        // Update with version check to avoid conflicts from concurrent debounced saves
        const { data, error } = await supabase
          .from('user_preferences')
          .update({
            [key]: value,
            row_version: currentVersion + 1,
            updated_by: userId,
          })
          .eq('user_id', userId)
          .eq('row_version', currentVersion) // Only update if version matches
          .select()
          .single();

        if (error) {
          // Check if this is a conflict (version mismatch causing 0 rows updated)
          if (error.code === 'PGRST116') {
            // Conflict detected - another update happened concurrently
            if (retryCount < 3) {
              console.log(
                `useUserPreferences: Conflict detected for ${key}, retrying (${retryCount + 1}/3)...`,
              );
              // Wait a bit before retrying to avoid tight loops
              await new Promise((resolve) => setTimeout(resolve, 100 * (retryCount + 1)));
              return updatePreference(key, value, retryCount + 1);
            } else {
              console.error(`useUserPreferences: Failed to update ${key} after 3 retries`);
              // Reload preferences to sync with latest state
              const {
                data: { user },
              } = await supabase.auth.getUser();
              if (user) {
                await loadPreferences(user);
              }
              throw new Error(
                'Your preferences were updated from another device. Please try again.',
              );
            }
          } else {
            console.error(`Error updating preference ${key}:`, error);
            return false;
          }
        }

        currentVersionRef.current = data.row_version;
        setPreferences(data);
        lastUpdateTimeRef.current = Date.now();
        return true;
      } catch (error) {
        console.error('Error in updatePreference:', error);
        throw error;
      } finally {
        isUpdatingRef.current = false;
      }
    },
    [userId, loadPreferences],
  );

  /**
   * Update multiple preferences at once with optimistic concurrency control and retry on conflict
   * @param {Object} updates - Object with key-value pairs to update
   * @param {number} retryCount - Internal: number of retries attempted (max 3)
   * @returns {Promise<boolean>} Success status
   * @throws {Error} If conflict persists after retries
   */
  const updatePreferences = useCallback(
    async (updates, retryCount = 0) => {
      if (!userId) {
        console.error('Cannot update preferences: No user logged in');
        return false;
      }

      // Prevent concurrent updates and add cooldown
      const now = Date.now();
      if (isUpdatingRef.current || now - lastUpdateTimeRef.current < 1000) {
        console.log(
          'useUserPreferences: Skipping bulk update - concurrent update or cooldown active',
        );
        return false;
      }

      try {
        isUpdatingRef.current = true;
        // Fetch current preferences to get the latest row_version
        const { data: currentPrefs, error: fetchError } = await supabase
          .from('user_preferences')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (fetchError) {
          console.error('Error fetching current preferences:', fetchError);
          return false;
        }

        const currentVersion = currentPrefs?.row_version || 0;

        // Update with version check
        console.log(
          `useUserPreferences: Attempting updates with version ${currentVersion} -> ${currentVersion + 1}`,
        );
        const { data, error } = await supabase
          .from('user_preferences')
          .update({
            ...updates,
            row_version: currentVersion + 1,
            updated_by: userId,
          })
          .eq('user_id', userId)
          .eq('row_version', currentVersion) // Only update if version matches
          .select()
          .single();

        if (error) {
          // Check if this is a conflict (version mismatch causing 0 rows updated)
          if (error.code === 'PGRST116') {
            // Conflict detected - another update happened concurrently
            if (retryCount < 3) {
              console.log(
                `useUserPreferences: Conflict detected for updates, retrying (${retryCount + 1}/3)...`,
              );
              // Wait a bit before retrying
              await new Promise((resolve) => setTimeout(resolve, 100 * (retryCount + 1)));
              return updatePreferences(updates, retryCount + 1);
            } else {
              console.error(`useUserPreferences: Failed to update preferences after 3 retries`);
              // Reload preferences to sync with latest state
              const {
                data: { user },
              } = await supabase.auth.getUser();
              if (user) {
                await loadPreferences(user);
              }
              throw new Error(
                'Your preferences were updated from another device. Please try again.',
              );
            }
          } else {
            console.error('Error updating preferences:', error);
            return false;
          }
        }

        currentVersionRef.current = data.row_version;
        setPreferences(data);
        lastUpdateTimeRef.current = Date.now();
        return true;
      } catch (error) {
        console.error('Error in updatePreferences:', error);
        throw error;
      } finally {
        isUpdatingRef.current = false;
      }
    },
    [userId, loadPreferences],
  );

  // Set up auth state listener and initial session load
  useEffect(() => {
    let ignore = false;

    // Get initial session (official pattern)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!ignore && session) {
        loadPreferences(session.user);
      } else if (!ignore) {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (ignore) return;

      if (session) {
        loadPreferences(session.user);
      } else {
        // User logged out - clean up
        setPreferences(null);
        setLoading(false);
        setUserId(null);
        if (channelRef.current) {
          channelRef.current.unsubscribe();
          channelRef.current = null;
        }
      }
    });

    return () => {
      ignore = true;
      subscription?.unsubscribe();
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
    };
  }, [loadPreferences]);

  // Set up real-time subscription for cross-device sync
  useEffect(() => {
    if (!userId) return;

    // Clean up existing subscription
    if (channelRef.current) {
      channelRef.current.unsubscribe();
      channelRef.current = null;
    }

    // Subscribe to all preference changes, filter in callback
    channelRef.current = supabase
      .channel(`user-preferences-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_preferences',
        },
        (payload) => {
          // Filter for this user only
          if (payload.new?.user_id === userId) {
            // Ignore updates made by this same user to prevent infinite loops
            if (
              payload.new.updated_by === userId &&
              payload.new.row_version === currentVersionRef.current + 1
            ) {
              // Update our version reference but don't trigger state update
              currentVersionRef.current = payload.new.row_version;
              return;
            }

            currentVersionRef.current = payload.new.row_version;
            setPreferences(payload.new);
          }
        },
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
    };
  }, [userId]);

  return {
    preferences,
    loading,
    updatePreference,
    updatePreferences,
  };
}
