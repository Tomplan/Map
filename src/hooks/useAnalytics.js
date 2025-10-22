import { useCallback } from 'react';

// Simulated analytics event sender (replace with real analytics API)
function sendAnalyticsEvent(event, data) {
  // For now, just log to console
  console.log('Analytics event:', event, data);
}

export default function useAnalytics() {
  const trackMarkerView = useCallback((markerId) => {
    sendAnalyticsEvent('marker_view', { markerId, timestamp: Date.now() });
  }, []);

  const trackMapInteraction = useCallback((type) => {
    sendAnalyticsEvent('map_interaction', { type, timestamp: Date.now() });
  }, []);

  return { trackMarkerView, trackMapInteraction };
}
