import React, { useEffect, useState } from 'react';

export default function OfflineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    function handleOnline() {
      setIsOnline(true);
    }
    function handleOffline() {
      setIsOnline(false);
    }
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-yellow-100 text-yellow-900 px-4 py-2 rounded shadow-lg z-50" role="status" aria-live="polite">
      <span aria-label="Offline mode">You are offline. Some features may be unavailable.</span>
    </div>
  );
}
