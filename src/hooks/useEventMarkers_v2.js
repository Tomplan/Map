import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabaseClient';

/**
 * Updated hook to fetch markers with company assignments
 * Uses new Companies and Assignments tables structure
 */
export default function useEventMarkers(eventYear = new Date().getFullYear()) {
  const cached = typeof window !== 'undefined' ? localStorage.getItem('eventMarkers') : null;
  const initialOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  const [isOnline, setIsOnline] = useState(initialOnline);
  const [markers, setMarkers] = useState(() => {
    if (!initialOnline && cached) {
      return JSON.parse(cached);
    }
    return [];
  });
  const [loading, setLoading] = useState(() => {
    if (!initialOnline && cached) {
      return false;
    }
    return true;
  });

  // Use ref to store current eventYear so real-time subscriptions always use latest value
  const eventYearRef = useRef(eventYear);

  // Update ref whenever eventYear changes
  useEffect(() => {
    eventYearRef.current = eventYear;
  }, [eventYear]);

  const loadMarkers = useCallback(
    async (online) => {
      // Always use the latest eventYear from ref
      const targetYear = eventYearRef.current;
      console.log('useEventMarkers: loadMarkers called with year', targetYear);

      setLoading(true);
      if (!online && cached) {
        setMarkers(JSON.parse(cached));
        setLoading(false);
        return;
      }

      try {
        // Fetch all data in parallel
        const [coreRes, appearanceRes, contentRes, adminRes, assignmentsRes, subscriptionsRes] = await Promise.all([
          supabase.from('Markers_Core').select('*'),
          supabase.from('Markers_Appearance').select('*'),
          supabase.from('Markers_Content').select('*'),
          supabase.from('Markers_Admin').select('*'),
          supabase.from('assignments').select(`
            *,
            company:companies(id, name, logo, website, info)
          `).eq('event_year', targetYear),
          supabase.from('event_subscriptions').select('*').eq('event_year', targetYear),
        ]);

        console.log('Fetched assignments for year', targetYear, ':', assignmentsRes.data?.length, 'assignments');

        if (coreRes.error) throw coreRes.error;
        if (appearanceRes.error) throw appearanceRes.error;
        if (contentRes.error) throw contentRes.error;
        if (adminRes.error) throw adminRes.error;
        if (assignmentsRes.error) throw assignmentsRes.error;
        if (subscriptionsRes.error) throw subscriptionsRes.error;

        // Build lookup maps
        const appearanceById = {};
        for (const row of appearanceRes.data || []) {
          if (row && row.id) appearanceById[row.id] = row;
        }

        const contentById = {};
        for (const row of contentRes.data || []) {
          if (row && row.id) contentById[row.id] = row;
        }

        const adminById = {};
        for (const row of adminRes.data || []) {
          if (row && row.id) adminById[row.id] = row;
        }

        // Build subscriptions lookup by company_id
        const subscriptionByCompany = {};
        for (const sub of subscriptionsRes.data || []) {
          if (sub && sub.company_id) {
            subscriptionByCompany[sub.company_id] = sub;
          }
        }

        // Group assignments by marker_id
        const assignmentsByMarker = {};
        for (const assignment of assignmentsRes.data || []) {
          if (!assignment || !assignment.marker_id) continue;

          if (!assignmentsByMarker[assignment.marker_id]) {
            assignmentsByMarker[assignment.marker_id] = [];
          }

          assignmentsByMarker[assignment.marker_id].push({
            assignmentId: assignment.id,
            companyId: assignment.company_id,
            ...assignment.company, // Spread company data (name, logo, website, info)
          });
        }

        // Merge all data
        const mergedMarkers = (coreRes.data || []).map((marker) => {
          const appearance = appearanceById[marker.id] || {};
          const content = contentById[marker.id] || {};
          const admin = adminById[marker.id] || {};
          const assignments = assignmentsByMarker[marker.id] || [];

          // Determine content source based on marker type
          let contentData = {};
          let adminData = {};

          if (marker.id < 1000) {
            // Booth markers: use company assignment data
            const primaryAssignment = assignments[0] || {};
            contentData = {
              name: primaryAssignment.name,
              logo: primaryAssignment.logo,
              website: primaryAssignment.website,
              info: primaryAssignment.info,
              companyId: primaryAssignment.companyId,
              assignmentId: primaryAssignment.assignmentId,
            };

            // If this marker has a company assignment, get subscription data for admin fields
            if (primaryAssignment.companyId) {
              const subscription = subscriptionByCompany[primaryAssignment.companyId] || {};
              adminData = {
                contact: subscription.contact,
                phone: subscription.phone,
                email: subscription.email,
                boothCount: subscription.booth_count,
                area: subscription.area,
                coins: subscription.coins,
                breakfast: subscription.breakfast_sat,
                lunch: subscription.lunch_sat,
                bbq: subscription.bbq_sat,
                notes: subscription.notes,
              };
            }
          } else {
            // Special markers: use Markers_Content data
            contentData = {
              name: content.name,
              logo: content.logo,
              website: content.website,
              info: content.info,
            };
            // Special markers use Markers_Admin data
            adminData = admin;
          }

          return {
            ...marker,
            ...appearance,
            ...contentData,
            ...adminData,

            // Assignment data (for booth markers)
            assignments, // Array of all assignments
          };
        });

        setMarkers(mergedMarkers);
        localStorage.setItem('eventMarkers', JSON.stringify(mergedMarkers));
      } catch (error) {
        console.error('Error loading markers:', error);
      } finally {
        setLoading(false);
      }
    },
    [cached]
  );

  useEffect(() => {
    loadMarkers(isOnline);

    function handleOnline() {
      setIsOnline(true);
      loadMarkers(true);
    }

    function handleOffline() {
      setIsOnline(false);
      const cached = localStorage.getItem('eventMarkers');
      if (cached) {
        setMarkers(JSON.parse(cached));
      }
      setLoading(false);
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Supabase realtime subscriptions for all related tables
    const coreChannel = supabase
      .channel('markers-core-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Markers_Core' }, () => {
        loadMarkers(true);
      })
      .subscribe();

    const appearanceChannel = supabase
      .channel('markers-appearance-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Markers_Appearance' }, () => {
        loadMarkers(true);
      })
      .subscribe();

    const contentChannel = supabase
      .channel('markers-content-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Markers_Content' }, () => {
        loadMarkers(true);
      })
      .subscribe();

    const adminChannel = supabase
      .channel('markers-admin-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Markers_Admin' }, () => {
        loadMarkers(true);
      })
      .subscribe();

    const assignmentsChannel = supabase
      .channel('markers-assignments-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assignments' }, async (payload) => {
        console.log('Assignment change detected:', payload.eventType, payload);

        // Handle different event types
        if (payload.eventType === 'DELETE') {
          // Assignment deleted - reload all markers to reflect the deletion
          // Note: Supabase DELETE payloads don't include marker_id, only the primary key
          console.log('Assignment deleted, reloading markers...');
          loadMarkers(true);
        } else if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          // For INSERT/UPDATE, check year before processing
          const assignment = payload.new;
          if (assignment?.event_year !== eventYearRef.current) {
            console.log('Assignment INSERT/UPDATE for different year, ignoring');
            return;
          }

          // Assignment added/updated - fetch company data and update marker
          if (assignment?.marker_id && assignment?.company_id) {
              try {
                const { data: companyData, error: companyError } = await supabase
                  .from('companies')
                  .select('id, name, logo, website, info')
                  .eq('id', assignment.company_id)
                  .single();

                if (!companyError && companyData) {
                  setMarkers(prev => prev.map(m =>
                    m.id === assignment.marker_id
                      ? {
                          ...m,
                          name: companyData.name,
                          logo: companyData.logo,
                          website: companyData.website,
                          info: companyData.info,
                          companyId: companyData.id,
                          assignmentId: assignment.id
                        }
                      : m
                  ));
                  // Update localStorage
                  setMarkers(current => {
                    localStorage.setItem('eventMarkers', JSON.stringify(current));
                    return current;
                  });
                } else {
                  // Fallback to full reload if company fetch fails
                  loadMarkers(true);
                }
              } catch (err) {
                console.error('Error fetching company for granular update:', err);
                loadMarkers(true);
              }
            }
          }
      })
      .subscribe();

    const companiesChannel = supabase
      .channel('companies-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'companies' }, (payload) => {
        console.log('Company change detected:', payload.eventType, payload);

        // Company data changed - update all markers using this company
        if (payload.eventType === 'UPDATE' && payload.new) {
          const company = payload.new;
          setMarkers(prev => prev.map(m =>
            m.companyId === company.id
              ? { ...m, name: company.name, logo: company.logo, website: company.website, info: company.info }
              : m
          ));
          // Update localStorage
          setMarkers(current => {
            localStorage.setItem('eventMarkers', JSON.stringify(current));
            return current;
          });
        } else {
          // For INSERT/DELETE, do full reload (rare events)
          loadMarkers(true);
        }
      })
      .subscribe();

    const subscriptionsChannel = supabase
      .channel(`event-subscriptions-changes-${eventYear}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'event_subscriptions',
          filter: `event_year=eq.${eventYear}`,
        },
        (payload) => {
          console.log('Subscription change detected:', payload.eventType, payload);
          loadMarkers(true);
        }
      )
      .subscribe();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      supabase.removeChannel(coreChannel);
      supabase.removeChannel(appearanceChannel);
      supabase.removeChannel(contentChannel);
      supabase.removeChannel(adminChannel);
      supabase.removeChannel(assignmentsChannel);
      supabase.removeChannel(companiesChannel);
      supabase.removeChannel(subscriptionsChannel);
    };
  }, [isOnline, loadMarkers]);

  // Reload markers when eventYear changes
  useEffect(() => {
    loadMarkers(isOnline);
  }, [eventYear, isOnline, loadMarkers]);

  return { markers, loading, isOnline, reload: () => loadMarkers(isOnline) };
}
