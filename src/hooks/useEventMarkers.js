import { useEffect, useState } from 'react';
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

  // Helper to load markers from Supabase
  const loadMarkers = async (online) => {
    const cached = localStorage.getItem('eventMarkers');
    if (!online && cached) {
      setMarkers(JSON.parse(cached));
      setLoading(false);
    } else if (online) {
      setLoading(true);
      const { data, error } = await supabase.from('Markers_Core').select('*');
      if (error) {
        setLoading(false);
        return;
      }
      setMarkers(data);
      localStorage.setItem('eventMarkers', JSON.stringify(data));
      setLoading(false);
    }
  };
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
  }, [isOnline]);

  return { markers, loading, isOnline };
}
