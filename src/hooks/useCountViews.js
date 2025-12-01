import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

/**
 * Custom hooks for real-time count subscriptions using database views
 * These hooks provide efficient, real-time count data from database views
 */

/**
 * Hook for subscription counts per event year
 * @param {number} eventYear - The year to get subscription count for
 * @returns {object} { count, loading, error }
 */
export function useSubscriptionCount(eventYear) {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Load initial count
    const loadCount = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('subscription_counts')
          .select('count')
          .eq('event_year', eventYear)
          .single();

        if (error) throw error;
        setCount(data?.count || 0);
      } catch (err) {
        console.error('Error loading subscription count:', err);
        setError(err.message);
        setCount(0);
      } finally {
        setLoading(false);
      }
    };

    loadCount();

    // Subscribe to real-time changes
    const channel = supabase
      .channel(`subscription-count-${eventYear}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'subscription_counts'
      }, (payload) => {
        console.log('Subscription count changed:', payload);
        // Reload count when view changes
        loadCount();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventYear]);

  return { count, loading, error };
}

/**
 * Hook for assignment counts per event year
 * @param {number} eventYear - The year to get assignment count for
 * @returns {object} { count, loading, error }
 */
export function useAssignmentCount(eventYear) {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Load initial count
    const loadCount = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('assignment_counts')
          .select('count')
          .eq('event_year', eventYear)
          .single();

        if (error) throw error;
        setCount(data?.count || 0);
      } catch (err) {
        console.error('Error loading assignment count:', err);
        setError(err.message);
        setCount(0);
      } finally {
        setLoading(false);
      }
    };

    loadCount();

    // Subscribe to real-time changes
    const channel = supabase
      .channel(`assignment-count-${eventYear}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'assignment_counts'
      }, (payload) => {
        console.log('Assignment count changed:', payload);
        // Reload count when view changes
        loadCount();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventYear]);

  return { count, loading, error };
}

/**
 * Hook for marker counts per event year (assignable booths)
 * @param {number} eventYear - The year to get marker count for
 * @returns {object} { count, loading, error }
 */
export function useMarkerCount(eventYear) {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Load initial count
    const loadCount = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('marker_counts')
          .select('count')
          .eq('event_year', eventYear)
          .single();

        if (error) throw error;
        setCount(data?.count || 0);
      } catch (err) {
        console.error('Error loading marker count:', err);
        setError(err.message);
        setCount(0);
      } finally {
        setLoading(false);
      }
    };

    loadCount();

    // Subscribe to real-time changes
    const channel = supabase
      .channel(`marker-count-${eventYear}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'marker_counts'
      }, (payload) => {
        console.log('Marker count changed:', payload);
        // Reload count when view changes
        loadCount();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventYear]);

  return { count, loading, error };
}

/**
 * Hook for total company count (not year-specific)
 * @returns {object} { count, loading, error }
 */
export function useCompanyCount() {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Load initial count
    const loadCount = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('company_counts')
          .select('count')
          .single();

        if (error) throw error;
        setCount(data?.count || 0);
      } catch (err) {
        console.error('Error loading company count:', err);
        setError(err.message);
        setCount(0);
      } finally {
        setLoading(false);
      }
    };

    loadCount();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('company-count')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'company_counts'
      }, (payload) => {
        console.log('Company count changed:', payload);
        // Reload count when view changes
        loadCount();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { count, loading, error };
}