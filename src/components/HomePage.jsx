import React, { useMemo, useCallback, memo } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useEventMapSettings from '../hooks/useEventMapSettings';
import { useOrganizationLogo } from '../contexts/OrganizationLogoContext';
import { getLogoPath, getResponsiveLogoSources } from '../utils/getLogoPath';
import { getDefaultLogoPath } from '../utils/getDefaultLogo';
import LanguageToggle from './LanguageToggle';
import { useSubscriptionCount } from '../hooks/useCountViews';

/**
 * Memoized logo component to prevent re-renders when other HomePage state changes
 */
const OrganizationLogoImage = memo(function OrganizationLogoImage({ 
  organizationLogo, 
  organizationLogoRaw, 
  eventName 
}) {
  const defaultLogo = getDefaultLogoPath(organizationLogoRaw);
  const [visibleLogo, setVisibleLogo] = React.useState(defaultLogo);

  React.useEffect(() => {
    // Always keep default visible until the final resolved URL finishes loading
    if (!organizationLogo || organizationLogo === visibleLogo) return;

    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (!cancelled) {
        setVisibleLogo(organizationLogo);
      }
    };
    img.onerror = () => {
      // If preload fails we'll leave the default in place
    };
    img.src = organizationLogo;

    return () => {
      cancelled = true;
    };
  }, [organizationLogo]);

  const responsiveSources = useMemo(() => 
    getResponsiveLogoSources(organizationLogo) || getResponsiveLogoSources(organizationLogoRaw),
    [organizationLogo, organizationLogoRaw]
  );

  const pngFallback = useMemo(() => 
    getLogoPath(organizationLogoRaw || visibleLogo || organizationLogo),
    [organizationLogoRaw, visibleLogo, organizationLogo]
  );

  const handleError = useCallback((e) => {
    const tried = parseInt(e.target.dataset.logoRetries || '0', 10);

    const trySetSrc = (newSrc) => {
      if (!newSrc || e.target.src === newSrc) return false;
      e.target.src = newSrc;
      e.target.srcset = '';
      e.target.dataset.logoRetries = String(tried + 1);
      return true;
    };

    // Try raw URL first if it's absolute
    if (tried === 0 && organizationLogoRaw && organizationLogoRaw.startsWith('http')) {
      if (trySetSrc(organizationLogoRaw)) return;
    }

    // Try normalized fallback
    if (tried <= 1) {
      const fallbackSrc = getLogoPath(organizationLogoRaw || organizationLogo);
      if (trySetSrc(fallbackSrc)) return;
    }

    // Final fallback to default
    trySetSrc(getDefaultLogoPath(organizationLogoRaw));
  }, [organizationLogoRaw, organizationLogo]);

  if (!organizationLogo) return null;

  return (
    <div className="mb-6">
      <picture>
        {responsiveSources?.srcSet && (
          <source srcSet={responsiveSources.srcSet} sizes={responsiveSources.sizes} type="image/webp" />
        )}
        <img
          src={responsiveSources ? responsiveSources.src : pngFallback}
          alt={eventName}
          className="h-24 mx-auto object-contain"
          onError={handleError}
        />
      </picture>
    </div>
  );
});

OrganizationLogoImage.propTypes = {
  organizationLogo: PropTypes.string,
  organizationLogoRaw: PropTypes.string,
  eventName: PropTypes.string.isRequired,
};

/**
 * HomePage - Landing page for event visitors
 * Optimized with memoization to reduce unnecessary re-renders
 */
function HomePage({ selectedYear, branding }) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { organizationLogo, organizationLogoRaw } = useOrganizationLogo();

  // Get subscribed companies count for the selected year
  const { count: exhibitorCount, loading: subscriptionsLoading } =
    useSubscriptionCount(selectedYear);
  const [displayCount, setDisplayCount] = React.useState(null);

  // Update displayed count once initial load finishes to avoid flash of 0.
  React.useEffect(() => {
    if (!subscriptionsLoading) {
      setDisplayCount(exhibitorCount);
    }
  }, [subscriptionsLoading, exhibitorCount]);

  // Memoize event info
  const eventInfo = useMemo(() => ({
    name: branding?.eventName || '4x4 Vakantiebeurs',
  }), [branding?.eventName]);

  // Prefer per-year dates from the event_map_settings table (via hook).
  const { settings: eventSettings } = useEventMapSettings(selectedYear);

  // Memoize date formatting function
  const formatDatesFromSettings = useCallback((start, end) => {
    if (!start && !end) return null;
    const lang = i18n?.language || 'en-US';
    if (start && end) {
      const s = new Date(start);
      const e = new Date(end);
      if (s.getFullYear() === e.getFullYear()) {
        if (s.getMonth() === e.getMonth()) {
          const month = s.toLocaleString(lang, { month: 'long' });
          return `${month} ${s.getDate()}-${e.getDate()}, ${s.getFullYear()}`;
        }
        const sStr = `${s.toLocaleString(lang, { month: 'short' })} ${s.getDate()}`;
        const eStr = `${e.toLocaleString(lang, { month: 'short' })} ${e.getDate()}, ${e.getFullYear()}`;
        return `${sStr} - ${eStr}`;
      }
      return `${s.toLocaleDateString(lang)} - ${e.toLocaleDateString(lang)}`;
    }
    const d = start ? new Date(start) : new Date(end);
    return d.toLocaleDateString(lang, { year: 'numeric', month: 'long', day: 'numeric' });
  }, [i18n?.language]);

  // Memoize derived values
  const dbEventDate = useMemo(() => 
    formatDatesFromSettings(eventSettings?.event_start_date, eventSettings?.event_end_date),
    [formatDatesFromSettings, eventSettings?.event_start_date, eventSettings?.event_end_date]
  );

  const eventDays = useMemo(() => {
    if (eventSettings?.event_start_date || eventSettings?.event_end_date) {
      try {
        const start = eventSettings?.event_start_date ? new Date(eventSettings.event_start_date) : null;
        const end = eventSettings?.event_end_date ? new Date(eventSettings.event_end_date) : null;
        if (start && end) {
          const msPerDay = 1000 * 60 * 60 * 24;
          const days = Math.round((end - start) / msPerDay) + 1;
          return days > 0 ? days : 1;
        }
        return 1;
      } catch (e) {
        return 2;
      }
    }
    return 2;
  }, [eventSettings?.event_start_date, eventSettings?.event_end_date]);

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      {/* Hero Section */}
      <div className="bg-white shadow-sm">
        <div className="max-w-screen-xl mx-auto px-4 py-8 text-center">
          {/* Language Toggle - Top Right */}
          <div className="flex justify-end mb-4">
            <LanguageToggle />
          </div>
          {/* Logo - Memoized component */}
          <OrganizationLogoImage
            organizationLogo={organizationLogo}
            organizationLogoRaw={organizationLogoRaw}
            eventName={eventInfo.name}
          />

          {/* Subtitle */}
          <p className="text-sm text-orange-600 mb-2" style={{ fontFamily: branding?.fontFamily }}>
            {t('homePage.subtitle')}
          </p>

          {/* Main Title */}
          <h1
            className="text-4xl font-bold text-orange-600 mb-4"
            style={{ fontFamily: branding?.fontFamily }}
          >
            {t('homePage.title')}
          </h1>

          {/* Event Date */}
          <p className="text-lg text-gray-600 mb-6">{dbEventDate || t('homePage.eventDate')}</p>

          {/* Quick Stats - Placeholder */}
          <div className="flex justify-center gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {subscriptionsLoading || displayCount === null ? '...' : displayCount}
              </div>
              <div className="text-sm text-gray-600">{t('homePage.exhibitors')}</div>
            </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {eventDays}
                </div>
                <div className="text-sm text-gray-600">{t('homePage.days')}</div>
              </div>
          </div>
        </div>
      </div>

      {/* Event Info Cards - Placeholder */}
      <div className="max-w-screen-xl mx-auto px-4 py-6">
        <div className="grid md:grid-cols-2 gap-4">
          {/* Opening Hours */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <span>🕒</span>
              {t('homePage.openingHours')}
            </h3>
            <p className="text-gray-700 whitespace-pre-line">{t('homePage.openingHoursInfo')}</p>
          </div>

          {/* Location */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <span>📍</span>
              {t('homePage.location')}
            </h3>
            <p className="text-gray-700 whitespace-pre-line">{t('homePage.locationInfo')}</p>
          </div>

          {/* Parking - Placeholder */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <span>🅿️</span>
              {t('homePage.parking')}
            </h3>
            <p className="text-gray-700">{t('homePage.parkingInfo')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

HomePage.propTypes = {
  selectedYear: PropTypes.number,
  branding: PropTypes.shape({
    eventName: PropTypes.string,
    fontFamily: PropTypes.string,
  }),
};

HomePage.defaultProps = {
  selectedYear: new Date().getFullYear(),
  branding: null,
};

export default memo(HomePage);
