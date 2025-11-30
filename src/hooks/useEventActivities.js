import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabaseClient';

/**
 * Hook to manage Event Activities (year-specific program management)
 * @param {number} eventYear - The year to load activities for (defaults to current year)
 * @returns {object} Activities data and CRUD operations
 */
export default function useEventActivities(eventYear = new Date().getFullYear()) {
  const [activities, setActivities] = useState({ saturday: [], sunday: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Use ref to store current eventYear so real-time subscriptions always use latest value
  const eventYearRef = useRef(eventYear);

  // Update ref whenever eventYear changes
  useEffect(() => {
    eventYearRef.current = eventYear;
  }, [eventYear]);

  // Load activities for specific year
  const loadActivities = useCallback(async (year) => {
    try {
      setLoading(true);
      setError(null);

      // Always use the latest eventYear from ref if no year specified
      const targetYear = year !== undefined ? year : eventYearRef.current;

      // Fetch activities with basic company info and badge visibility
      // TODO: Remove fallback logic after event_year column is added
      let query = supabase
        .from('event_activities')
        .select(`
          *,
          companies!event_activities_company_id_fkey (
            id,
            name
          )
        `)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      // Only filter by event_year if the column exists (after migration)
      // For now, this will work with existing data
      try {
        query = query.eq('event_year', targetYear);
      } catch (e) {
        // Column doesn't exist yet, fetch all activities
        console.warn('event_year column not found, fetching all activities');
      }

      const { data: activitiesData, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      // Note: company_translations table only contains 'info' field for descriptions,
      // not company names. Company names are stored directly in the companies table.
      // For now, we'll use the company name from the companies table directly.

      // Group activities by day
      const saturday = activitiesData?.filter(a => a.day === 'saturday') || [];
      const sunday = activitiesData?.filter(a => a.day === 'sunday') || [];

      setActivities({ saturday, sunday });
    } catch (err) {
      console.error('Error fetching event activities:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create new activity
  const createActivity = useCallback(async (activityData) => {
    try {
      const dataWithYear = {
        ...activityData,
        event_year: activityData.event_year || eventYear,
      };

      const { data, error: insertError } = await supabase
        .from('event_activities')
        .insert([dataWithYear])
        .select(`
          *,
          companies!event_activities_company_id_fkey (
            id,
            name
          )
        `)
        .single();

      if (insertError) throw insertError;

      // Update local state
      const day = data.day;
      setActivities(prev => ({
        ...prev,
        [day]: [...prev[day], data].sort((a, b) => a.display_order - b.display_order)
      }));

      return { data, error: null };
    } catch (err) {
      console.error('Error creating activity:', err);
      return { data: null, error: err.message };
    }
  }, [eventYear]);

  // Update activity
  const updateActivity = useCallback(async (id, updates) => {
    try {
      const { data, error: updateError } = await supabase
        .from('event_activities')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          companies!event_activities_company_id_fkey (
            id,
            name
          )
        `)
        .single();

      if (updateError) throw updateError;

      // Update local state
      setActivities(prev => {
        const newActivities = { ...prev };
        for (const day of ['saturday', 'sunday']) {
          newActivities[day] = newActivities[day].map(a => a.id === id ? data : a);
        }
        return newActivities;
      });

      return { data, error: null };
    } catch (err) {
      console.error('Error updating activity:', err);
      return { data: null, error: err.message };
    }
  }, []);

  // Delete activity
  const deleteActivity = useCallback(async (id) => {
    try {
      const { error: deleteError } = await supabase
        .from('event_activities')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      // Update local state
      setActivities(prev => {
        const newActivities = { ...prev };
        for (const day of ['saturday', 'sunday']) {
          newActivities[day] = newActivities[day].filter(a => a.id !== id);
        }
        return newActivities;
      });

      return { error: null };
    } catch (err) {
      console.error('Error deleting activity:', err);
      return { error: err.message };
    }
  }, []);

  // Archive current year and prepare for next year
  const archiveCurrentYear = useCallback(async () => {
    try {
      // Call Supabase function to archive
      const { data, error: archiveError } = await supabase.rpc('archive_event_activities', {
        year_to_archive: eventYear,
      });

      if (archiveError) throw archiveError;

      setActivities({ saturday: [], sunday: [] });
      return { data, error: null };
    } catch (err) {
      console.error('Error archiving activities:', err);
      return { data: null, error: err.message };
    }
  }, [eventYear]);

  // Load archived activities for a specific year
  const loadArchivedActivities = useCallback(async (year) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('event_activities_archive')
        .select(`
          *,
          companies!event_activities_archive_company_id_fkey (
            id,
            name
          )
        `)
        .eq('event_year', year)
        .order('display_order', { ascending: true });

      if (fetchError) throw fetchError;

      // Group archived activities by day
      const saturday = data?.filter(a => a.day === 'saturday') || [];
      const sunday = data?.filter(a => a.day === 'sunday') || [];

      return { data: { saturday, sunday }, error: null };
    } catch (err) {
      console.error('Error loading archived activities:', err);
      return { data: null, error: err.message };
    }
  }, []);

  // Copy activities from previous year
  const copyFromPreviousYear = useCallback(async (sourceYear) => {
    try {
      // Fetch activities from source year
      const { data: sourceActivities, error: fetchError } = await supabase
        .from('event_activities')
        .select('*')
        .eq('event_year', sourceYear);

      if (fetchError) throw fetchError;

      if (!sourceActivities || sourceActivities.length === 0) {
        return { data: null, error: 'No activities found for source year' };
      }

      // Copy activities to current year
      const newActivities = sourceActivities.map(activity => ({
        ...activity,
        event_year: eventYear,
        id: undefined, // Let database generate new ID
        created_at: undefined, // Let database set new timestamp
        updated_at: undefined,
      }));

      const { data, error: insertError } = await supabase
        .from('event_activities')
        .insert(newActivities)
        .select();

      if (insertError) throw insertError;

      await loadActivities();
      return { data, error: null };
    } catch (err) {
      console.error('Error copying activities from previous year:', err);
      return { data: null, error: err.message };
    }
  }, [eventYear, loadActivities]);

  // Initial load
  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  // Reload activities when eventYear changes
  useEffect(() => {
    loadActivities();
  }, [eventYear, loadActivities]);

  // Subscribe to realtime changes - filter by event year
  useEffect(() => {
    const channel = supabase
      .channel(`event-activities-changes-${eventYear}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'event_activities',
          filter: `event_year=eq.${eventYear}`,
        },
        (payload) => {
          // For INSERT events, check if we already have this activity locally
          if (payload.eventType === 'INSERT' && payload.new) {
            setActivities((prev) => {
              // Check if this activity already exists
              const day = payload.new.day;
              const exists = prev[day]?.some(a => a.id === payload.new.id);
              if (exists) {
                // We already have it (we created it locally), no need to reload
                return prev;
              }
              // New activity from another user/session, reload to get full data
              loadActivities();
              return prev;
            });
          } else {
            // For UPDATE/DELETE, always reload
            loadActivities();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventYear, loadActivities]);

  // Listen for broadcasts from admin UI when activities change and refetch across the app
  useEffect(() => {
    const handleBroadcast = () => loadActivities();
    window.addEventListener('eventActivitiesUpdated', handleBroadcast);
    return () => window.removeEventListener('eventActivitiesUpdated', handleBroadcast);
  }, [loadActivities]);

  /**
   * Get location display text for an activity
   * @param {object} activity - The activity object
   * @param {string} language - 'nl' or 'en'
   * @returns {object} { text, boothNumber, companyId }
   */
  function getActivityLocation(activity, language) {
    if (activity.location_type === 'exhibitor' && activity.companies) {
      const company = activity.companies;
      
      // Note: company_translations table only contains 'info' (descriptions), not company names.
      // Company names are stored directly in the companies table.
      // Booth numbers would require joining through assignments table to markers.
      // For now, just show company name from companies table.
      
      return {
        text: company.name,
        boothNumber: null, // Would need to query assignments + markers to get glyph
        companyId: company.id,
      };
    }

    // Venue location - use static text
    return {
      text: language === 'nl' ? activity.location_nl : language === 'de' ? activity.location_de : activity.location_en,
      boothNumber: null,
      companyId: null,
    };
  }

  return {
    activities,
    loading,
    error,
    getActivityLocation,
    createActivity,
    updateActivity,
    deleteActivity,
    archiveCurrentYear,
    loadArchivedActivities,
    copyFromPreviousYear,
    refetch: loadActivities,
  };
}
