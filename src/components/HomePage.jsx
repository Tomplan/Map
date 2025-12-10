import React from 'react';
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
 * HomePage - Landing page for event visitors
 * TODO: Phase 2 - Add event info, quick stats, welcome message
 */
export default function HomePage({ selectedYear, branding }) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  // The provider now exposes both 'organizationLogo' (resolved URL) and
  // 'organizationLogoRaw' (original DB value). Consumers can use the raw
  // value as a fallback when a generated variant is missing from storage.
  const { organizationLogo, organizationLogoRaw, loading } = useOrganizationLogo();

  // Debug logging
  console.log('[HomePage] organizationLogo:', organizationLogo);
  console.log('[HomePage] loading:', loading);

  // Manage visible logo to avoid flicker: show default until the target
  // organization logo has fully loaded. We preload the final image and only
  // swap when onload fires so users don't see a brief flash between images.
  const defaultLogo = getDefaultLogoPath(organizationLogoRaw);
  const [visibleLogo, setVisibleLogo] = React.useState(defaultLogo);
  const [logoLoaded, setLogoLoaded] = React.useState(false);

  React.useEffect(() => {
    // Always keep default visible until the final resolved URL finishes loading
    if (!organizationLogo || organizationLogo === visibleLogo) return;

    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (!cancelled) {
        setVisibleLogo(organizationLogo);
        setLogoLoaded(true);
      }
    };
    img.onerror = () => {
      // If preload fails we'll leave the default in place; don't retry endlessly
      if (!cancelled) setLogoLoaded(false);
    };
    img.src = organizationLogo;

    return () => {
      cancelled = true;
    };
  }, [organizationLogo, organizationLogoRaw]);

  // Get subscribed companies count for the selected year and avoid a flash
  // by keeping the last-known value until loading completes.
  const { count: exhibitorCount, loading: subscriptionsLoading } =
    useSubscriptionCount(selectedYear);
  const [displayCount, setDisplayCount] = React.useState(null);

  // Update displayed count once initial load finishes to avoid flash of 0.
  React.useEffect(() => {
    if (!subscriptionsLoading) {
      setDisplayCount(exhibitorCount);
    }
  }, [subscriptionsLoading, exhibitorCount]);

  // Event info from actual website
  const eventInfo = {
    name: branding?.eventName || '4x4 Vakantiebeurs',
  };

  // Prefer per-year dates from the event_map_settings table (via hook).
  const { settings: eventSettings } = useEventMapSettings(selectedYear);

  const formatDatesFromSettings = (start, end) => {
    if (!start && !end) return null;
    const lang = i18n?.language || 'en-US';
    if (start && end) {
      const s = new Date(start);
      const e = new Date(end);
      // same month and year: October 10-11, 2026
      if (s.getFullYear() === e.getFullYear()) {
        if (s.getMonth() === e.getMonth()) {
          const month = s.toLocaleString(lang, { month: 'long' });
          return `${month} ${s.getDate()}-${e.getDate()}, ${s.getFullYear()}`;
        }
        // same year different month: Oct 31 - Nov 2, 2026
        const sStr = `${s.toLocaleString(lang, { month: 'short' })} ${s.getDate()}`;
        const eStr = `${e.toLocaleString(lang, { month: 'short' })} ${e.getDate()}, ${e.getFullYear()}`;
        return `${sStr} - ${eStr}`;
      }
      // different years
      return `${s.toLocaleDateString(lang)} - ${e.toLocaleDateString(lang)}`;
    }
    const d = start ? new Date(start) : new Date(end);
    return d.toLocaleDateString(lang, { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const dbEventDate = formatDatesFromSettings(eventSettings?.event_start_date, eventSettings?.event_end_date);

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      {/* Hero Section */}
      <div className="bg-white shadow-sm">
        <div className="max-w-screen-xl mx-auto px-4 py-8 text-center">
          {/* Language Toggle - Top Right */}
          <div className="flex justify-end mb-4">
            <LanguageToggle />
          </div>
          {/* Logo */}
          {organizationLogo && (
            <div className="mb-6">
              {/* Prefer responsive webp sources when possible. The <picture> element
                  lets browsers choose the best supported resource. The <img> src is
                  set to a PNG fallback (raw or default) so browsers that don't
                  support webp still show an image. */}
              {(() => {
                const r = getResponsiveLogoSources(organizationLogo) ||
                  getResponsiveLogoSources(organizationLogoRaw);
                // The displayed image source should come from visibleLogo to avoid
                // swapping before preload completes; fall back to visibleLogo
                // (which initially is the default PNG path).
                const pngFallback = getLogoPath(organizationLogoRaw || visibleLogo || organizationLogo);

                return (
                  <picture>
                    {r && r.srcSet && (
                      <source srcSet={r.srcSet} sizes={r.sizes} type="image/webp" />
                    )}
                    <img
                      src={r ? r.src : pngFallback}
                      alt={eventInfo.name}
                      className="h-24 mx-auto object-contain"
                      onError={(e) => {
                  // Avoid trying the same URL repeatedly. Keep a small retry counter
                  // on the element to limit fallback attempts and prevent infinite loops.
                  const tried = parseInt(e.target.dataset.logoRetries || '0', 10);

                  // Helper to safely set a new src and mark retry count
                  const trySetSrc = (newSrc) => {
                    if (!newSrc || e.target.src === newSrc) return false;
                    e.target.src = newSrc;
                    e.target.srcset = '';
                    e.target.dataset.logoRetries = String(tried + 1);
                    return true;
                  };

                  // Candidate 1: if the DB raw value is an absolute URL and we haven't
                  // tried it yet, attempt it next (this handles the case where a
                  // generated variant may not exist on the storage bucket).
                  if (tried === 0 && organizationLogoRaw && organizationLogoRaw.startsWith('http')) {
                    console.log('[HomePage] Logo error, trying raw URL:', organizationLogoRaw);
                    if (trySetSrc(organizationLogoRaw)) return;
                  }

                  // Candidate 2: try a normalized path based on whichever source we
                  // have available (raw preferred). This may be the same as the
                  // initial resolved value but trySetSrc will avoid resetting to same src.
                  if (tried <= 1) {
                    const sourceToTry = organizationLogoRaw || organizationLogo;
                    const fallbackSrc = getLogoPath(sourceToTry);
                    console.log('[HomePage] Logo error, trying normalized fallback:', fallbackSrc);
                    if (trySetSrc(fallbackSrc)) return;
                  }

                  // Candidate 3: Give up and use the static default (absolute path)
                  // so the UI still shows a useful image instead of repeated failures.
                  const defaultPath = getDefaultLogoPath(organizationLogoRaw);
                  console.log('[HomePage] Logo error, final fallback to default:', defaultPath);
                  trySetSrc(defaultPath);
                }}
                    />
                  </picture>
                );
              })()}
            </div>
          )}

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
                  {(() => {
                    // if DB-driven dates are available, compute inclusive days
                    if (eventSettings?.event_start_date || eventSettings?.event_end_date) {
                      try {
                        const start = eventSettings?.event_start_date ? new Date(eventSettings.event_start_date) : null;
                        const end = eventSettings?.event_end_date ? new Date(eventSettings.event_end_date) : null;
                        if (start && end) {
                          const msPerDay = 1000 * 60 * 60 * 24;
                          const days = Math.round((end - start) / msPerDay) + 1;
                          return days > 0 ? days : 1;
                        }
                        // only one date present -> treat as single day
                        return 1;
                      } catch (e) {
                        return 2;
                      }
                    }
                    // fallback to previous static value
                    return 2;
                  })()}
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
