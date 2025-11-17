import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrganizationLogo } from '../contexts/OrganizationLogoContext';
import { getLogoPath } from '../utils/getLogoPath';

/**
 * HomePage - Landing page for event visitors
 * TODO: Phase 2 - Add event info, quick stats, welcome message
 */
export default function HomePage({ selectedYear, branding }) {
  const navigate = useNavigate();
  const { organizationLogo } = useOrganizationLogo();

  // Placeholder - will be replaced with real data in Phase 2
  const eventInfo = {
    name: branding?.eventName || '4x4 Vakantiebeurs',
    date: 'October 10-11, 2026',
    location: 'WaterGoed, BeNeLux',
    hours: '10:00 - 18:00',
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      {/* Hero Section */}
      <div className="bg-white shadow-sm">
        <div className="max-w-screen-xl mx-auto px-4 py-8 text-center">
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

          {/* Welcome */}
          <h1 className="text-3xl font-bold text-gray-900 mb-2" style={{ fontFamily: branding?.fontFamily }}>
            Welcome to {eventInfo.name}
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            {eventInfo.date}
          </p>

          {/* Quick Stats - Placeholder */}
          <div className="flex justify-center gap-6 mb-8">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">67</div>
              <div className="text-sm text-gray-600">Exhibitors</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">2</div>
              <div className="text-sm text-gray-600">Days</div>
            </div>
          </div>

          {/* CTA Button */}
          <button
            onClick={() => navigate('/map')}
            className="bg-orange-600 hover:bg-orange-700 text-white font-semibold px-8 py-3 rounded-lg text-lg transition-colors"
          >
            View Interactive Map
          </button>
        </div>
      </div>

      {/* Event Info Cards - Placeholder */}
      <div className="max-w-screen-xl mx-auto px-4 py-6">
        <div className="grid md:grid-cols-2 gap-4">
          {/* Opening Hours */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <span>🕒</span>
              Opening Hours
            </h3>
            <p className="text-gray-700">{eventInfo.hours}</p>
          </div>

          {/* Location */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <span>📍</span>
              Location
            </h3>
            <p className="text-gray-700">{eventInfo.location}</p>
          </div>

          {/* Parking - Placeholder */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <span>🅿️</span>
              Parking
            </h3>
            <p className="text-gray-700">Free parking available on site</p>
          </div>

          {/* WiFi - Placeholder */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <span>📶</span>
              WiFi
            </h3>
            <p className="text-gray-700">Network: Event-Guest</p>
          </div>
        </div>

        {/* Phase 2 Notice */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            📝 <strong>Note:</strong> This is a Phase 1 placeholder. In Phase 2, this page will show real event data, welcome messages, and upcoming activities.
          </p>
        </div>
      </div>
    </div>
  );
}
