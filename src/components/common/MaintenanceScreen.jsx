import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import HomePage from '../HomePage';
import useOrganizationProfile from '../../hooks/useOrganizationProfile';
import PublicLoadingScreen from './PublicLoadingScreen';

export default function MaintenanceScreen({ branding, selectedYear }) {
  const { t, i18n } = useTranslation();
  const { profile, loading: profileLoading } = useOrganizationProfile();
  const activeLanguage = (i18n.resolvedLanguage || i18n.language || 'nl').split('-')[0];
  const fallbackLocale = profile?.maintenance_message_fallback_locale || 'nl';
  const messageByLocale = {
    nl: profile?.maintenance_message_nl,
    en: profile?.maintenance_message_en,
    de: profile?.maintenance_message_de,
  };

  const localizedMaintenanceMessage = messageByLocale[activeLanguage];
  const fallbackMaintenanceMessage =
    messageByLocale[fallbackLocale] || profile?.maintenance_message;

  const maintenanceMessage =
    localizedMaintenanceMessage ||
    fallbackMaintenanceMessage ||
    t('maintenanceScreen.defaultMessage');

  const [timeLeft, setTimeLeft] = useState(null);
  const [isCountdownReady, setIsCountdownReady] = useState(false);
  const [hasCompletedInitialLoad, setHasCompletedInitialLoad] = useState(false);
  const initialLoadStartedAt = React.useRef(Date.now());

  useEffect(() => {
    if (profileLoading) {
      setIsCountdownReady(false);
      return;
    }

    const targetDate = profile?.countdown_target_date
      ? new Date(profile.countdown_target_date)
      : null;

    if (!targetDate) {
      setTimeLeft(null);
      setIsCountdownReady(true);
      return;
    }

    const updateTimeLeft = () => {
      const now = new Date().getTime();
      const distance = targetDate.getTime() - now;

      if (distance < 0) {
        setTimeLeft(null);
        return false;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));

      setTimeLeft({ days, hours, minutes });
      setIsCountdownReady(true);
      return true;
    };

    if (!updateTimeLeft()) {
      setIsCountdownReady(true);
      return;
    }

    const timer = setInterval(() => {
      if (!updateTimeLeft()) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [profile?.countdown_target_date, profileLoading]);

  const isInitialMaintenanceLoading = profileLoading || !isCountdownReady;
  const showInitialLoader = !hasCompletedInitialLoad;

  useEffect(() => {
    if (hasCompletedInitialLoad) {
      return undefined;
    }

    if (isInitialMaintenanceLoading) {
      return undefined;
    }

    const elapsed = Date.now() - initialLoadStartedAt.current;
    const remaining = Math.max(0, 700 - elapsed);
    const timer = window.setTimeout(() => {
      setHasCompletedInitialLoad(true);
    }, remaining);

    return () => window.clearTimeout(timer);
  }, [hasCompletedInitialLoad, isInitialMaintenanceLoading]);

  if (showInitialLoader) {
    return <PublicLoadingScreen />;
  }

  return (
    <div>
      <HomePage
        selectedYear={selectedYear}
        branding={branding}
        initialLoadingEnabled={false}
        afterHeroContent={
          <section className="max-w-screen-xl mx-auto px-4 pt-6">
            <div className="bg-white rounded-2xl shadow p-6 md:p-8 border border-gray-100 max-w-3xl mx-auto text-center animate-fade-in-up">
              {timeLeft && (
                <div className="mb-8">
                  <h3
                    className="text-sm text-orange-600 mb-4"
                    style={{ fontFamily: branding?.fontFamily }}
                  >
                    {t('maintenanceScreen.countdownTitle')}
                  </h3>
                  <div className="grid grid-cols-3 gap-4 max-w-md mx-auto text-center">
                    <div className="aspect-square rounded-2xl bg-orange-500 text-white shadow-sm flex flex-col items-center justify-center">
                      <div className="text-2xl md:text-3xl font-bold">{timeLeft.days}</div>
                      <div className="text-sm font-medium">{t('homePage.days')}</div>
                    </div>
                    <div className="aspect-square rounded-2xl bg-orange-500 text-white shadow-sm flex flex-col items-center justify-center">
                      <div className="text-2xl md:text-3xl font-bold">
                        {timeLeft.hours.toString().padStart(2, '0')}
                      </div>
                      <div className="text-sm font-medium">{t('maintenanceScreen.hours')}</div>
                    </div>
                    <div className="aspect-square rounded-2xl bg-orange-500 text-white shadow-sm flex flex-col items-center justify-center">
                      <div className="text-2xl md:text-3xl font-bold">
                        {timeLeft.minutes.toString().padStart(2, '0')}
                      </div>
                      <div className="text-sm font-medium">{t('maintenanceScreen.minutes')}</div>
                    </div>
                  </div>
                </div>
              )}

              <h2 className="text-2xl md:text-3xl font-bold text-orange-600">
                {maintenanceMessage}
              </h2>
            </div>
          </section>
        }
      />
    </div>
  );
}
