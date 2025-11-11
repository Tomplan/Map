import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

/**
 * Hook for managing event subscriptions (year-specific company participation)
 * @param {number} eventYear - The year to load subscriptions for
 * @returns {object} Subscriptions data and CRUD operations
 */
export default function useEventSubscriptions(eventYear) {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load subscriptions for the given year
  const loadSubscriptions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('event_subscriptions')
        .select(`
          *,
          company:companies(id, name, logo, website, info, contact, phone, email)
        `)
        .eq('event_year', eventYear)
        .order('id', { ascending: true });

      if (fetchError) throw fetchError;

      setSubscriptions(data || []);
    } catch (err) {
      console.error('Error loading event subscriptions:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [eventYear]);

  // Subscribe a company to the event year
  const subscribeCompany = async (companyId, subscriptionData = {}) => {
    try {
      // Get current user for created_by
      const { data: { user } } = await supabase.auth.getUser();
      const created_by = user?.email || 'unknown';

      // Fetch company defaults for contact info
      const { data: company } = await supabase
        .from('companies')
        .select('contact, phone, email')
        .eq('id', companyId)
        .single();

      const { data, error: insertError } = await supabase
        .from('event_subscriptions')
        .insert({
          company_id: companyId,
          event_year: eventYear,
          contact: subscriptionData.contact || company?.contact || '',
          phone: subscriptionData.phone || company?.phone || '',
          email: subscriptionData.email || company?.email || '',
          booth_count: subscriptionData.booth_count || 1,
          area: subscriptionData.area || '',
          breakfast_sat: subscriptionData.breakfast_sat || 0,
          lunch_sat: subscriptionData.lunch_sat || 0,
          bbq_sat: subscriptionData.bbq_sat || 0,
          breakfast_sun: subscriptionData.breakfast_sun || 0,
          lunch_sun: subscriptionData.lunch_sun || 0,
          coins: subscriptionData.coins || 0,
          notes: subscriptionData.notes || '',
          created_by,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      await loadSubscriptions();
      return { data, error: null };
    } catch (err) {
      console.error('Error subscribing company:', err);
      return { data: null, error: err.message };
    }
  };

  // Update a subscription
  const updateSubscription = async (subscriptionId, updates) => {
    try {
      const { data, error: updateError } = await supabase
        .from('event_subscriptions')
        .update(updates)
        .eq('id', subscriptionId)
        .select()
        .single();

      if (updateError) throw updateError;

      await loadSubscriptions();
      return { data, error: null };
    } catch (err) {
      console.error('Error updating subscription:', err);
      return { data: null, error: err.message };
    }
  };

  // Unsubscribe a company from the event year
  const unsubscribeCompany = async (subscriptionId) => {
    try {
      const { error: deleteError } = await supabase
        .from('event_subscriptions')
        .delete()
        .eq('id', subscriptionId);

      if (deleteError) throw deleteError;

      await loadSubscriptions();
      return { error: null };
    } catch (err) {
      console.error('Error unsubscribing company:', err);
      return { error: err.message };
    }
  };

  // Archive subscriptions for the current year
  const archiveCurrentYear = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const archived_by = user?.email || 'unknown';

      const { data, error: archiveError } = await supabase.rpc(
        'archive_event_subscriptions',
        {
          year_to_archive: eventYear,
          archived_by_user: archived_by,
        }
      );

      if (archiveError) throw archiveError;

      await loadSubscriptions();
      return { data, error: null };
    } catch (err) {
      console.error('Error archiving subscriptions:', err);
      return { data: null, error: err.message };
    }
  };

  // Load archived subscriptions for a specific year
  const loadArchivedSubscriptions = async (year) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('event_subscriptions_archive')
        .select('*')
        .eq('event_year', year)
        .order('archived_at', { ascending: false });

      if (fetchError) throw fetchError;

      return { data, error: null };
    } catch (err) {
      console.error('Error loading archived subscriptions:', err);
      return { data: null, error: err.message };
    }
  };

  // Copy subscriptions from previous year
  const copyFromPreviousYear = async (sourceYear) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const created_by = user?.email || 'unknown';

      // Fetch subscriptions from source year
      const { data: sourceSubscriptions, error: fetchError } = await supabase
        .from('event_subscriptions')
        .select('*')
        .eq('event_year', sourceYear);

      if (fetchError) throw fetchError;

      if (!sourceSubscriptions || sourceSubscriptions.length === 0) {
        return { data: null, error: 'No subscriptions found for source year' };
      }

      // Copy subscriptions to current year
      const newSubscriptions = sourceSubscriptions.map(sub => ({
        company_id: sub.company_id,
        event_year: eventYear,
        contact: sub.contact,
        phone: sub.phone,
        email: sub.email,
        booth_count: sub.booth_count,
        area: sub.area,
        breakfast_sat: sub.breakfast_sat,
        lunch_sat: sub.lunch_sat,
        bbq_sat: sub.bbq_sat,
        breakfast_sun: sub.breakfast_sun,
        lunch_sun: sub.lunch_sun,
        coins: sub.coins,
        notes: sub.notes,
        created_by,
      }));

      const { data, error: insertError } = await supabase
        .from('event_subscriptions')
        .insert(newSubscriptions)
        .select();

      if (insertError) throw insertError;

      await loadSubscriptions();
      return { data, error: null };
    } catch (err) {
      console.error('Error copying subscriptions from previous year:', err);
      return { data: null, error: err.message };
    }
  };

  // Load subscriptions on mount and when year changes
  useEffect(() => {
    loadSubscriptions();
  }, [loadSubscriptions]);

  // Subscribe to real-time changes
  useEffect(() => {
    const channel = supabase
      .channel('event-subscriptions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'event_subscriptions',
          filter: `event_year=eq.${eventYear}`,
        },
        () => {
          loadSubscriptions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventYear, loadSubscriptions]);

  return {
    subscriptions,
    loading,
    error,
    subscribeCompany,
    updateSubscription,
    unsubscribeCompany,
    archiveCurrentYear,
    loadArchivedSubscriptions,
    copyFromPreviousYear,
    reload: loadSubscriptions,
  };
}
