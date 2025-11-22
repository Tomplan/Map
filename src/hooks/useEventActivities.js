import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

/**
 * Hook to fetch event activities from database with live booth numbers
 * Returns activities grouped by day, with company info for exhibitor locations
 */
export function useEventActivities() {
  const [activities, setActivities] = useState({ saturday: [], sunday: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchActivities();
  }, []);

  async function fetchActivities() {
    try {
      setLoading(true);
      setError(null);

      // Fetch activities with basic company info
      const { data: activitiesData, error: fetchError } = await supabase
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
  }

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
      text: language === 'nl' ? activity.location_nl : activity.location_en,
      boothNumber: null,
      companyId: null,
    };
  }

  return {
    activities,
    loading,
    error,
    getActivityLocation,
    refetch: fetchActivities,
  };
}
