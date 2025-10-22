import { useEffect, useState } from 'react';

// Simulated fetch function (replace with Supabase or real API)
async function fetchMarkers() {
  // Simulate network delay
  await new Promise((r) => setTimeout(r, 500));
  return [
    { id: 1, lat: 51.899, lng: 5.779, label: 'Main Stage' },
    { id: 2, lat: 51.898, lng: 5.780, label: 'Food Court' },
  ];
}
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

  // Helper to load markers based on online/offline status
  const loadMarkers = async (online) => {
    const cached = localStorage.getItem('eventMarkers');
    if (!online && cached) {
      setMarkers(JSON.parse(cached));
      setLoading(false);
    } else if (online) {
      setLoading(true);
      const data = await fetchMarkers();
      setMarkers(data);
      localStorage.setItem('eventMarkers', JSON.stringify(data));
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMarkers(isOnline);
    let lastOnline = isOnline;
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
      lastOnline = false;
    }
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isOnline]);

  return { markers, loading, isOnline };
}
