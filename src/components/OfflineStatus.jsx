import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Icon from '@mdi/react';
import { mdiWifiOff, mdiClose } from '@mdi/js';

export default function OfflineStatus() {
  const { t } = useTranslation();
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  );
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    function handleOnline() {
      setIsOnline(true);
      setShowBanner(false);
    }
    function handleOffline() {
      setIsOnline(false);
      setShowBanner(true);
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
    <>
      <div
        className="fixed bottom-20 left-4 z-[90] inline-flex h-10 w-10 items-center justify-center rounded-full border border-yellow-300 bg-yellow-100 text-yellow-800 shadow-lg"
        role="status"
        aria-live="polite"
        aria-label={t('common.offlineIconLabel')}
        title={t('common.offlineWarning')}
      >
        <Icon path={mdiWifiOff} size={0.9} />
      </div>

      {showBanner ? (
        <div
          className="fixed bottom-20 left-1/2 z-[90] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-xl border border-yellow-300 bg-yellow-100 px-4 py-3 text-yellow-900 shadow-lg"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-start gap-3">
            <div className="pt-0.5 text-yellow-800">
              <Icon path={mdiWifiOff} size={0.9} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{t('common.offlineWarning')}</p>
            </div>
            <button
              type="button"
              onClick={() => setShowBanner(false)}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full text-yellow-800 transition-colors hover:bg-yellow-200"
              aria-label={t('common.dismiss')}
              title={t('common.dismiss')}
            >
              <Icon path={mdiClose} size={0.75} />
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
