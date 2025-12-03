import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import Icon from '@mdi/react';
import { mdiCheckCircle, mdiPlayCircle, mdiRestart, mdiMapMarker, mdiViewDashboard, mdiAccountGroup } from '@mdi/js';
import { useOnboarding } from '../../contexts/OnboardingContext';
import useOnboardingTour from '../../hooks/useOnboardingTour';
import useUserRole from '../../hooks/useUserRole';
import { getAllVisitorTours } from '../../config/tourSteps/visitorTourSteps';
import { getAllAdminTours } from '../../config/tourSteps/adminTourSteps';

/**
 * TourList Component
 *
 * Displays available tours with completion status and start buttons
 */
export default function TourList() {
  const { t } = useTranslation();
  const location = useLocation();
  const { role } = useUserRole();
  const { isTourCompleted } = useOnboarding();

  // Get all available tours
  const visitorTours = getAllVisitorTours();
  const adminTours = getAllAdminTours();

  // Filter tours based on user role
  const availableTours = React.useMemo(() => {
    const allTours = [...visitorTours, ...adminTours];

    return allTours.filter(tour => {
      // No role restriction - available to all
      if (!tour.roles) return true;

      // Super admin sees everything
      if (role === 'super_admin') return true;

      // Check if user has required role
      return tour.roles.includes(role);
    });
  }, [visitorTours, adminTours, role]);

  // Prioritize tours relevant to current route
  const sortedTours = React.useMemo(() => {
    return [...availableTours].sort((a, b) => {
      const aRelevant = isRelevantToRoute(a.id, location.pathname);
      const bRelevant = isRelevantToRoute(b.id, location.pathname);

      if (aRelevant && !bRelevant) return -1;
      if (!aRelevant && bRelevant) return 1;
      return 0;
    });
  }, [availableTours, location.pathname]);

  if (availableTours.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>{t('tour.noToursAvailable')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 mb-4">
        {t('tour.availableTours')}
      </p>

      {sortedTours.map(tour => (
        <TourCard key={tour.id} tour={tour} />
      ))}
    </div>
  );
}

/**
 * TourCard Component
 *
 * Individual tour card with title, description, and start button
 */
function TourCard({ tour }) {
  const { t, i18n } = useTranslation();
  const { isTourCompleted } = useOnboarding();
  const { start } = useOnboardingTour(tour);

  const completed = isTourCompleted(tour.id);
  const currentLanguage = i18n.language;

  // Get localized title (if tour has title field)
  const title = getLocalizedContent(tour.title || tour.id, currentLanguage);
  const description = getLocalizedContent(
    tour.description || getTourDescription(tour.id),
    currentLanguage
  );
  const icon = getTourIcon(tour.id);
  const duration = getTourDuration(tour.id);

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-1">
          <Icon path={icon} size={1.2} className="text-blue-600" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h4 className="text-base font-semibold text-gray-800">{title}</h4>
            {completed && (
              <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full flex-shrink-0">
                <Icon path={mdiCheckCircle} size={0.5} />
                {t('tour.tourCompleted')}
              </span>
            )}
          </div>

          <p className="text-sm text-gray-600 mb-2">{description}</p>

          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">
              {t('tour.duration', { minutes: duration })}
            </span>

            <button
              onClick={() => start()}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Icon path={completed ? mdiRestart : mdiPlayCircle} size={0.6} />
              {completed ? t('tour.restartTour') : t('tour.startTour')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

TourCard.propTypes = {
  tour: PropTypes.object.isRequired,
};

/**
 * Helper functions
 */

function getLocalizedContent(content, language) {
  if (typeof content === 'string') return content;
  if (typeof content === 'object' && content !== null) {
    return content[language] || content.en || '';
  }
  return '';
}

function isRelevantToRoute(tourId, pathname) {
  const routeMap = {
    'visitor-welcome': ['/'],
    'visitor-map': ['/map'],
    'visitor-exhibitors': ['/exhibitors'],
    'admin-dashboard': ['/admin'],
    'admin-map-management': ['/admin/map'],
    'admin-data-management': ['/admin/companies', '/admin/subscriptions', '/admin/assignments'],
  };

  const relevantRoutes = routeMap[tourId] || [];
  return relevantRoutes.some(route => pathname.startsWith(route));
}

function getTourIcon(tourId) {
  const iconMap = {
    'visitor-welcome': mdiPlayCircle,
    'visitor-map': mdiMapMarker,
    'visitor-exhibitors': mdiAccountGroup,
    'admin-dashboard': mdiViewDashboard,
    'admin-map-management': mdiMapMarker,
    'admin-data-management': mdiAccountGroup,
  };

  return iconMap[tourId] || mdiPlayCircle;
}

function getTourDescription(tourId) {
  const descriptionMap = {
    'visitor-welcome': {
      en: 'A quick introduction to the event and how to navigate the app.',
      nl: 'Een snelle introductie van het evenement en hoe je de app gebruikt.',
    },
    'visitor-map': {
      en: 'Learn how to use the interactive map to find exhibitors and navigate the venue.',
      nl: 'Leer hoe je de interactieve kaart gebruikt om exposanten te vinden en het terrein te navigeren.',
    },
    'visitor-exhibitors': {
      en: 'Discover how to browse, search, and favorite exhibitors in the list view.',
      nl: 'Ontdek hoe je door exposanten bladert, zoekt en favorieten toevoegt in de lijstweergave.',
    },
    'admin-dashboard': {
      en: 'Get started with the admin panel and understand key metrics and navigation.',
      nl: 'Ga aan de slag met het admin paneel en begrijp belangrijke statistieken en navigatie.',
    },
    'admin-map-management': {
      en: 'Learn how to manage map markers, booth locations, and customize the visitor map.',
      nl: 'Leer hoe je kaartmarkers, standlocaties beheert en de bezoekerskaart aanpast.',
    },
    'admin-data-management': {
      en: 'Master company management, subscriptions, assignments, and data import/export.',
      nl: 'Beheers bedrijfsbeheer, inschrijvingen, toewijzingen en data import/export.',
    },
  };

  return descriptionMap[tourId] || { en: '', nl: '' };
}

function getTourDuration(tourId) {
  const durationMap = {
    'visitor-welcome': 1,
    'visitor-map': 2,
    'visitor-exhibitors': 1,
    'admin-dashboard': 2,
    'admin-map-management': 3,
    'admin-data-management': 2,
  };

  return durationMap[tourId] || 2;
}
