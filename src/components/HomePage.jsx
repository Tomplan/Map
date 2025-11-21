import React from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useOrganizationLogo } from '../contexts/OrganizationLogoContext';
import { getLogoPath } from '../utils/getLogoPath';
import LanguageToggle from './LanguageToggle';

/**
 * HomePage - Landing page for event visitors
 * TODO: Phase 2 - Add event info, quick stats, welcome message
 */
export default function HomePage({ selectedYear, branding }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { organizationLogo } = useOrganizationLogo();

  // Event info from actual website
  const eventInfo = {
    name: branding?.eventName || '4x4 Vakantiebeurs',
  };

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
              <img
                src={getLogoPath(organizationLogo)}
                alt={eventInfo.name}
                className="h-24 mx-auto object-contain"
              />
            </div>
          )}

          {/* Subtitle */}
          <p className="text-sm text-orange-600 mb-2" style={{ fontFamily: branding?.fontFamily }}>
            {t('homePage.subtitle')}
          </p>
          
          {/* Main Title */}
          <h1 className="text-4xl font-bold text-orange-600 mb-4" style={{ fontFamily: branding?.fontFamily }}>
            {t('homePage.title')}
          </h1>
          
          {/* Event Date */}
          <p className="text-lg text-gray-600 mb-6">
            {t('homePage.eventDate')}
          </p>

          {/* Quick Stats - Placeholder */}
          <div className="flex justify-center gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">67</div>
              <div className="text-sm text-gray-600">{t('homePage.exhibitors')}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">2</div>
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

        {/* Phase 2 Notice */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800" dangerouslySetInnerHTML={{ __html: `📝 ${t('homePage.phaseNote')}` }} />
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
