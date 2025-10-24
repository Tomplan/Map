import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
export default function useEventMarkers() {
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

  const loadMarkers = React.useCallback(async (online) => {
    setLoading(true);
    if (!online && cached) {
      setMarkers(JSON.parse(cached));
      setLoading(false);
      return;
    }
    // Fetch marker data from Supabase tables
    const [coreRes, appearanceRes, contentRes, adminRes] = await Promise.all([
      supabase.from('Markers_Core').select('*'),
      supabase.from('Markers_Appearance').select('*'),
      supabase.from('Markers_Content').select('*'),
      supabase.from('Markers_Admin').select('*'),
    ]);
    // Merge by id
    const byId = {};
    for (const row of coreRes.data || []) {
      if (row && row.id) byId[row.id] = { ...row };
    }
    for (const row of appearanceRes.data || []) {
      if (row && row.id) byId[row.id] = { ...byId[row.id], ...row };
    }
    for (const row of contentRes.data || []) {
      if (row && row.id) byId[row.id] = { ...byId[row.id], ...row };
    }
    for (const row of adminRes.data || []) {
      if (row && row.id) byId[row.id] = { ...byId[row.id], ...row };
    }
    // Ensure each marker has lat/lng fields for map
    const mergedMarkers = Object.values(byId).map(marker => {
      let lat, lng;
      if (typeof marker.position === 'string') {
        const parts = marker.position.split(',').map((p) => parseFloat(p.trim()));
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          lat = parts[0];
          lng = parts[1];
        }
      }
      // If lat/lng not set, fallback to marker.lat/lng if present
      if (lat === undefined && marker.lat !== undefined) lat = marker.lat;
      if (lng === undefined && marker.lng !== undefined) lng = marker.lng;
      return {
        ...marker,
        lat,
        lng,
      };
    });
    console.log('Merged markers:', mergedMarkers); // Diagnostic log
    setMarkers(mergedMarkers);
    localStorage.setItem('eventMarkers', JSON.stringify(mergedMarkers));
    setLoading(false);
  }, [cached]);

  useEffect(() => {
    loadMarkers(isOnline);
    function handleOnline() {
      setIsOnline(true);
    }
    function handleOffline() {
      setIsOnline(false);
      // Always reload cached markers when going offline
      const cached = localStorage.getItem('eventMarkers');
      if (cached) {
        setMarkers(JSON.parse(cached));
      }
      setLoading(false);
    }
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    // Supabase realtime subscription
    let subscription;
    if (isOnline) {
      subscription = supabase
        .channel('public:markers')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'markers' }, () => {
          loadMarkers(true);
        })
        .subscribe();
    }
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (subscription) supabase.removeChannel(subscription);
    };
  }, [isOnline, loadMarkers]);

  return { markers, loading, isOnline };
}
