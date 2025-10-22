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
  const [markers, setMarkers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cached = localStorage.getItem('eventMarkers');
    if (cached) {
      setMarkers(JSON.parse(cached));
      setLoading(false);
    } else {
      fetchMarkers().then((data) => {
        setMarkers(data);
        localStorage.setItem('eventMarkers', JSON.stringify(data));
        setLoading(false);
      });
    }
  }, []);

  return { markers, loading };
}
