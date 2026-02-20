import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabaseClient';
import normalizePhone from '../utils/phone';

/**
 * Hook for managing event subscriptions (year-specific company participation)
 * @param {number} eventYear - The year to load subscriptions for
 * @returns {object} Subscriptions data and CRUD operations
 */
export default function useEventSubscriptions(eventYear) {
  // cache per eventYear
  if (!useEventSubscriptions.cache) useEventSubscriptions.cache = new Map();
  let entry = useEventSubscriptions.cache.get(eventYear);
  if (!entry) {
    entry = {
      state: { subscriptions: [], loading: true, error: null },
      listeners: new Set(),
      refCount: 0,
      channel: null,
      reloadTimeout: null,
      loadPromise: null,
    };
    useEventSubscriptions.cache.set(eventYear, entry);
  }

  const [local, setLocal] = useState({
    subscriptions: entry.state.subscriptions,
    loading: entry.state.loading,
    error: entry.state.error,
  });

  // Load subscriptions for the given year
  const loadSubscriptions = useCallback(
    async (isReload = false) => {
      // If we have a pending load and this isn't a forced reload, return the existing promise
      if (entry.loadPromise && !isReload) {
        return entry.loadPromise;
      }

      // If we already have data and aren't forcing a reload, return early
      if (entry.state.subscriptions.length > 0 && !entry.state.loading && !isReload) {
        if (local.loading) {
          setLocal((prev) => ({ ...prev, loading: false }));
        }
        return Promise.resolve();
      }

      entry.loadPromise = (async () => {
        try {
          // Clear any pending debounced reload
          if (entry.reloadTimeout) {
            clearTimeout(entry.reloadTimeout);
            entry.reloadTimeout = null;
          }

          entry.state.loading = true;
          entry.state.error = null;

          const { data, error: fetchError } = await supabase
            .from('event_subscriptions')
            .select(
              `
            *,
              company:companies(id, name, logo, website, info, contact, phone, email)

          `,
            )
            .eq('event_year', eventYear)
            .order('id', { ascending: true });

          if (fetchError) throw fetchError;

          entry.state.subscriptions = data || [];
        } catch (err) {
          console.error('Error loading event subscriptions:', err);
          entry.state.error = err.message;
        } finally {
          entry.state.loading = false;
          entry.listeners.forEach((l) => l(entry.state));
          entry.loadPromise = null;
        }
      })();

      await entry.loadPromise;
    },
    [eventYear],
  );

  // Subscribe a company to the event year
  const subscribeCompany = async (companyId, subscriptionData = {}) => {
    try {
      // Get current user for created_by
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const created_by = user?.email || 'unknown';

      // Fetch company defaults for contact info
      const { data: company } = await supabase
        .from('companies')
        .select('contact, phone, email')
        .eq('id', companyId)
        .single();

      // Fetch organization defaults for meal counts (separate Saturday/Sunday)
      const { data: orgProfile } = await supabase
        .from('organization_profile')
        .select(
          'default_breakfast_sat, default_lunch_sat, default_bbq_sat, default_breakfast_sun, default_lunch_sun, default_coins',
        )
        .eq('id', 1)
        .single();

      const defaultBreakfastSat = orgProfile?.default_breakfast_sat || 0;
      const defaultLunchSat = orgProfile?.default_lunch_sat || 0;
      const defaultBbqSat = orgProfile?.default_bbq_sat || 0;
      const defaultBreakfastSun = orgProfile?.default_breakfast_sun || 0;
      const defaultLunchSun = orgProfile?.default_lunch_sun || 0;
      const defaultCoins =
        typeof orgProfile?.default_coins === 'number' ? orgProfile.default_coins : 0;

      // Normalize phone before inserting
      const phoneToInsert = subscriptionData.phone
        ? normalizePhone(subscriptionData.phone)
        : company?.phone
          ? normalizePhone(company.phone)
          : '';
      // Normalize email to lowercase
      const emailToInsert = (subscriptionData.email || company?.email || '').toLowerCase().trim();

      const { data, error: insertError } = await supabase
        .from('event_subscriptions')
        .insert({
          company_id: companyId,
          event_year: eventYear,
          contact: subscriptionData.contact || company?.contact || '',
          phone: phoneToInsert,
          email: emailToInsert,
          booth_count: subscriptionData.booth_count || 1,
          area: subscriptionData.area || '',
          breakfast_sat: subscriptionData.breakfast_sat ?? defaultBreakfastSat,
          lunch_sat: subscriptionData.lunch_sat ?? defaultLunchSat,
          bbq_sat: subscriptionData.bbq_sat ?? defaultBbqSat,
          breakfast_sun: subscriptionData.breakfast_sun ?? defaultBreakfastSun,
          lunch_sun: subscriptionData.lunch_sun ?? defaultLunchSun,
          coins: subscriptionData.coins ?? defaultCoins,
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
      // Normalize phone before updating
      if (typeof updates.phone !== 'undefined') updates.phone = normalizePhone(updates.phone);
      // Normalize email to lowercase
      if (updates.email) updates.email = updates.email.toLowerCase().trim();

      const { data, error: updateError } = await supabase
        .from('event_subscriptions')
        .update(updates)
        .eq('id', subscriptionId)
        .select(
          `
          *,
            company:companies(id, name, logo, website, info, contact, phone, email)

        `,
        )
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
      // Get the subscription to find company_id and event_year
      const { data: subscription, error: fetchError } = await supabase
        .from('event_subscriptions')
        .select('company_id, event_year')
        .eq('id', subscriptionId)
        .single();

      if (fetchError) throw fetchError;

      // Delete all booth assignments for this company in this year
      const { error: assignmentsError } = await supabase
        .from('assignments')
        .delete()
        .eq('company_id', subscription.company_id)
        .eq('event_year', subscription.event_year);

      if (assignmentsError) throw assignmentsError;

      // Delete the subscription
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
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const archived_by = user?.email || 'unknown';

      const { data, error: archiveError } = await supabase.rpc('archive_event_subscriptions', {
        year_to_archive: eventYear,
        archived_by_user: archived_by,
      });

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
      const {
        data: { user },
      } = await supabase.auth.getUser();
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
      const newSubscriptions = sourceSubscriptions.map((sub) => ({
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

  // hook instance lifecycle: register listener / kick off load / start channel
  useEffect(() => {
    // update entry reference (in case eventYear changed)
    entry = useEventSubscriptions.cache.get(eventYear);
    if (!entry) {
      // unexpected, recreate entry so we don't crash
      entry = {
        state: { subscriptions: [], loading: true, error: null },
        listeners: new Set(),
        refCount: 0,
        channel: null,
        reloadTimeout: null,
        loadPromise: null,
      };
      useEventSubscriptions.cache.set(eventYear, entry);
    }

    entry.refCount += 1;
    const listener = (s) =>
      setLocal({
        subscriptions: s.subscriptions,
        loading: s.loading,
        error: s.error,
      });
    entry.listeners.add(listener);

    // sync local state if different (data or loading)
    // If cache has data, ensure we use it AND turn off loading
    if (entry.state.subscriptions.length > 0) {
      setLocal({
        subscriptions: entry.state.subscriptions,
        loading: false,
        error: entry.state.error,
      });
    } else if (local.subscriptions !== entry.state.subscriptions) {
      setLocal({
        subscriptions: entry.state.subscriptions,
        loading: entry.state.loading,
        error: entry.state.error,
      });
    }

    if (entry.state.subscriptions.length === 0) {
      // If empty, we should load.
      if (!entry.loadPromise) {
        loadSubscriptions();
      }
    }

    // start realtime channel if first subscriber
    if (!entry.channel) {
      entry.channel = supabase
        .channel(`event-subscriptions-changes-${eventYear}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'event_subscriptions',
            filter: `event_year=eq.${eventYear}`,
          },
          () => {
            if (entry.reloadTimeout) clearTimeout(entry.reloadTimeout);
            entry.reloadTimeout = setTimeout(() => {
              loadSubscriptions(true);
            }, 500);
          },
        )
        .subscribe();
    }

    return () => {
      entry.listeners.delete(listener);
      entry.refCount -= 1;
      // Do NOT delete cache entry on unmount.
      // This is the fix for "I had a working app and you destroyed it".
      // We keep the cache so navigating away and back doesn't reload.
      // useEventSubscriptions.cache.delete(eventYear); // REMOVED

      // We still clean up channels if no one is listening to save resources,
      // but we keep the data in memory.
      if (entry.refCount <= 0) {
        if (entry.channel) {
          supabase.removeChannel(entry.channel);
          entry.channel = null; // Clear channel so it reconnects on next mount
        }
      }
      if (entry.reloadTimeout) clearTimeout(entry.reloadTimeout);
    };
  }, [eventYear, loadSubscriptions]);
  return {
    subscriptions: local.subscriptions,
    loading: local.loading,
    error: local.error,
    subscribeCompany,
    updateSubscription,
    unsubscribeCompany,
    archiveCurrentYear,
    loadArchivedSubscriptions,
    copyFromPreviousYear,
    reload: loadSubscriptions,
  };
}
