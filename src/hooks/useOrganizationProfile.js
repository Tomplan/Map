import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

/**
 * A hook to manage the organization's profile data.
 * It fetches, updates, and subscribes to real-time changes for the single-row Organization_Profile table.
 * Note: Uses 'logo' field to match companies table structure.
 */
export default function useOrganizationProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('Organization_Profile')
        .select('*')
        .single(); // We only expect one row

      if (error) {
        // If no row is found, it might not be an error, but we should log it.
        // Supabase returns an error if .single() finds no rows.
        if (error.code === 'PGRST116') {
          console.warn('No organization profile found. A default one should be created by the migration.');
          setProfile(null);
        } else {
          throw error;
        }
      }
      
      setProfile(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching organization profile:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel('public:Organization_Profile')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'Organization_Profile', filter: 'id=eq.1' },
        (payload) => {
          if (payload.new) {
            setProfile(payload.new);
          }
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(subscription);
    };
  }, [fetchProfile]);

  /**
   * Updates the organization profile.
   * @param {object} updates - An object containing the fields to update.
   */
  const updateProfile = async (updates) => {
    try {
      const { data, error } = await supabase
        .from('Organization_Profile')
        .update(updates)
        .eq('id', 1) // Always update the singleton row
        .select()
        .single();

      if (error) throw error;

      setProfile(data);
      return { data, error: null };
    } catch (err) {
      console.error('Error updating organization profile:', err);
      return { data: null, error: err.message };
    }
  };

  return { profile, loading, error, updateProfile };
}
