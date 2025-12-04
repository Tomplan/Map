import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import Icon from '@mdi/react';
import { mdiCheckCircle, mdiPlayCircle, mdiRestart, mdiMapMarker, mdiViewDashboard, mdiAccountGroup } from '@mdi/js';
import { useOnboarding } from '../../contexts/OnboardingContext';
import useOnboardingTour from '../../hooks/useOnboardingTour';
import { useDialog } from '../../contexts/DialogContext';
import useUserRole from '../../hooks/useUserRole';
import { getAllVisitorTours } from '../../config/tourSteps/visitorTourSteps';
import { getAllAdminTours } from '../../config/tourSteps/adminTourSteps';

/**
 * TourList Component
 *
 * Displays available tours with completion status and start buttons
 */
export default function TourList({ startSource, onClose, onReopen }) {
  const { t } = useTranslation();
  const location = useLocation();
  const { role } = useUserRole();
  const { isTourCompleted, startTour, tours } = useOnboarding();

  // Get all available tours
  const visitorTours = getAllVisitorTours();
  const adminTours = getAllAdminTours();

  // Determine app scope from current route (admin vs visitor)
  // Detect scope from both pathname and hash. The app sometimes uses a
  // base path like "/Map/" with hash routing ("#/admin") so a plain
  // pathname check will miss admin routes. Use pathname OR hash to derive
  // the current scope reliably.
  const currentScope = React.useMemo(() => {
    const path = location.pathname || '';
    const hash = location.hash || '';
    const isAdmin = path.startsWith('/admin') || hash.startsWith('#/admin') || hash.startsWith('#/admin/');
    return isAdmin ? 'admin' : 'visitor';
  }, [location.pathname, location.hash]);

  // Filter tours based on user role and current route scope
  const availableTours = React.useMemo(() => {
    const allTours = [...visitorTours, ...adminTours];

    return allTours
      .filter(tour => {
        // Scope filtering: if the tour has an explicit `scope`, only show it in matching routes.
        if (tour.scope && tour.scope !== currentScope) return false;

        return true;
      })
      .filter(tour => {
      // No role restriction - available to all
      if (!tour.roles) return true;

      // Super admin sees everything
      if (role === 'super_admin') return true;

      // Check if user has required role
      return tour.roles.includes(role);
    });
  }, [visitorTours, adminTours, role, currentScope]);

  // Prioritize tours relevant to current route
  const sortedTours = React.useMemo(() => {
    return [...availableTours].sort((a, b) => {
      const aRelevant = isRelevantToRoute(a.id, location.pathname, location.hash);
      const bRelevant = isRelevantToRoute(b.id, location.pathname, location.hash);

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
    <div className="space-y-3">
      {sortedTours.map(tour => (
        <TourCard 
          key={tour.id} 
          tour={tour} 
          startTour={startTour} 
          isTourCompleted={isTourCompleted}
          startSource={startSource}
          onClose={onClose}
        />
      ))}
    </div>
  );
}

TourList.propTypes = {
  startSource: PropTypes.string.isRequired,
  onClose: PropTypes.func,
  onReopen: PropTypes.func,
};

TourList.defaultProps = {
  onClose: () => {},
  onReopen: null,
};

/**
 * TourCard Component
 *
 * Individual tour card with title, description, and start button
 */
function TourCard({ tour, startTour, startSource, onClose, isTourCompleted }) {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { confirm, toastWarning } = useDialog();
  const { start } = useOnboardingTour(tour);

  const completed = isTourCompleted(tour.id);
  const currentLanguage = i18n.language;

  // Determine whether required targets for this tour are likely present
  const requiredSteps = React.useMemo(() => (tour.steps || []).filter(s => s.element && s.element !== 'body'), [tour]);
  const allRequiredMissing = React.useMemo(() => (
    requiredSteps.length > 0 && requiredSteps.every(s => !document.querySelector(s.element))
  ), [requiredSteps]);

  // Decide whether the Start button should be disabled.
  // Behaviour: only disable when ALL required targets are missing and
  // there is no known scope to navigate to. If the tour has an explicit
  // `scope` (for example `admin`) we will allow the Start button to be
  // actionable so the UI can navigate the user to the correct context and
  // re-attempt the tour. This avoids showing greyed-out Start buttons
  // in the Help Panel and lets the app provide a better guidance flow.
  const shouldDisableStart = React.useMemo(() => {
    if (!allRequiredMissing) return false;
    // If no explicit scope is provided and the tour doesn't follow the
    // well-known 'admin-' / 'visitor-' naming convention, disable the
    // Start button — otherwise keep it actionable so the app can
    // navigate or let the tour start() preflight decide.
    if (!tour.scope && !/^admin-|visitor-/.test(tour.id)) return true;

    return false;
  }, [allRequiredMissing, tour.scope]);

  // Get localized title (if tour has title field)
  const title = getLocalizedContent(tour.title || tour.id, currentLanguage);
  const description = getLocalizedContent(
    tour.description || getTourDescription(tour.id),
    currentLanguage
  );
  const icon = getTourIcon(tour.id);
  const duration = getTourDuration(tour.id);

  const handleStartTour = async () => {
    // DEBUG: trace when start flow is triggered (tests rely on this)
    console.log('[TOUR DEBUG] handleStartTour clicked for', tour.id, 'source:', startSource);
    console.log('[TOUR DEBUG] start function type:', typeof start);
    try {
      if (typeof startTour === 'function') {
        const stsrc = (startTour && startTour.toString && startTour.toString().slice(0, 240)) || String(startTour);
        console.log('[TOUR DEBUG] startTour function source preview:', stsrc);
      } else {
        console.log('[TOUR DEBUG] startTour type:', typeof startTour);
      }
    } catch (err) {
      /* ignore */
    }
    try {
      // Diagnostic: print a short prefix of the function source so we can
      // identify whether the `start` function is the test mock or a real
      // implementation during unit tests.
      if (typeof start === 'function') {
        const src = (start && start.toString && start.toString().slice(0, 240)) || String(start);
        console.log('[TOUR DEBUG] start function source preview:', src);
      }
    } catch (err) {
      /* ignore diagnostics */
    }
    // Determine the target path: prefer explicit tour.path, otherwise
    // infer from well-known tour id patterns (visitor- / admin- prefixes)
    const targetPath = tour.path || inferPathFromTourId(tour.id);
    console.log('[TOUR DEBUG] targetPath:', targetPath, 'current location:', location.pathname, location.hash);

    // Helper to determine whether current location is already the
    // requested target. This considers both hash and pathname forms
    // to correctly handle deployments where the app is served from
    // a base path (e.g. /Map/#/admin) or direct paths (/#/admin).
    const isAlreadyOnTarget = (() => {
      if (!targetPath) return false;

      // Check the hash-based route: '#/admin' -> '/admin'
      const currentHash = (location.hash || '').startsWith('#') ? location.hash.substring(1) : location.hash || '';

      // Check pathname as well (some builds use /admin directly)
      const currentPathname = location.pathname || '';

      const normalize = p => (p ? (p.endsWith('/') ? p.slice(0, -1) : p) : '');

      const currentHashNorm = normalize(currentHash);
      const currentPathnameNorm = normalize(currentPathname);
      const targetNorm = normalize(targetPath);

      // If either the hash or pathname matches the target, consider us already there
      const result = currentHashNorm === targetNorm || currentPathnameNorm.endsWith(targetNorm) || currentPathnameNorm === targetNorm;
      console.log('[TOUR DEBUG] isAlreadyOnTarget:', result, '(currentHash:', currentHashNorm, 'currentPath:', currentPathnameNorm, 'target:', targetNorm + ')');
      return result;
    })();

    // Check page location FIRST before attempting to start the tour.
    // If we need to navigate to a different page, show confirmation immediately.
    try {
      // If tour requires a specific page AND we're not on that page,
      // show confirmation dialog FIRST (don't waste time trying to start)
      if (targetPath && !isAlreadyOnTarget) {
        // Close help panel first so dialog appears on top layer (no greyout)
        if (onClose) onClose();

        const tourTitle = getLocalizedContent(tour.title || tour.id, i18n.language);
        const confirmed = await confirm({
          title: t('tour.navigationRequiredTitle'),
          message: t('tour.navigationRequiredText', { page: tourTitle }),
        });

        if (confirmed) {
          // User confirmed - navigate to target page and start tour
          try { sessionStorage.setItem('onboarding:startAfterNav', JSON.stringify({ id: tour.id, source: startSource })); } catch (e) { /* ignore */ }
          navigate(targetPath);
          // In environments where the Help panel remains mounted (tests or
          // special routing), attempt a retry start after navigation so
          // the tour can begin without relying on external page listeners.
          if (typeof start === 'function') {
            setTimeout(() => {
              try { start({ source: startSource, waitMs: 7000 }); } catch (e) { /* ignore */ }
            }, 900);
          }
          return;
        } else {
          // User cancelled - reopen help panel if tour was started from help
          console.log('[TOUR DEBUG] User cancelled navigation. startSource:', startSource, 'onReopen:', typeof onReopen);
          if (startSource === 'help' && onReopen) {
            console.log('[TOUR DEBUG] Calling onReopen to restore help panel');
            onReopen();
          } else {
            console.log('[TOUR DEBUG] Not calling onReopen. startSource === "help":', startSource === 'help', 'onReopen exists:', !!onReopen);
          }
          return;
        }
      }

      // We're already on the target page - try to start the tour
      const startResult = await start ? await start({ source: startSource }) : null;

      // Normalize the result so callers can check success consistently
      const startFailed = startResult === false || (startResult && typeof startResult === 'object' && startResult.success === false);

      if (!startFailed) {
        // Started successfully (or there was no local start function), nothing more to do
        if (!startResult) {
          // If start() didn't exist we still want to signal the onboarding
          // context so other components can pick up the active tour.
          startTour(tour.id, startSource);
        }
        return;
      }

      // Start failed even though we're on the right page - show error
      try {
        toastWarning(t('tour.startFailed', 'This tour could not be started because required page elements are not present.'));
      } catch (e) {
        console.warn('Failed to show tour failure toast', e);
      }

      return;
    } catch (e) {
      // Non-fatal: fall back to the old context start which will try to start
      // the tour globally. This preserves backward-compatibility.
      try { startTour(tour.id, startSource); } catch (e2) { console.warn('Fallback start failed', e2); }
      return;
    }
  };

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
              onClick={handleStartTour}
              disabled={shouldDisableStart}
              aria-disabled={shouldDisableStart}
              title={shouldDisableStart ? 'This tour requires a specific page to be visible for this tour' : undefined}
              className={`flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${shouldDisableStart ? 'bg-gray-300 text-gray-700 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
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
  startTour: PropTypes.func.isRequired,
  startSource: PropTypes.string.isRequired,
  onClose: PropTypes.func,
  isTourCompleted: PropTypes.func.isRequired,
};

TourCard.defaultProps = {
  onClose: () => {},
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
  const path = pathname || '';
  // If app uses hash routing (eg /Map/#/admin) the relevant route might be
  // in the location.hash rather than pathname. When possible pass the hash
  // as the third argument so we inspect it as well.
  const hash = arguments.length > 2 ? arguments[2] : '';

  // Check both pathname and hash for the route candidate.
  return relevantRoutes.some(route => path.startsWith(route) || hash.startsWith('#' + route) || hash.startsWith('#' + route + '/'));
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

/**
 * Infer a reasonable target path from a tour ID when the tour config
 * does not include an explicit `path` property. This supports older test
 * fixtures and keeps behaviour predictable for common admin/visitor ids.
 */
function inferPathFromTourId(tourId) {
  if (!tourId || typeof tourId !== 'string') return null;

  if (tourId.startsWith('admin-')) {
    if (tourId === 'admin-dashboard') return '/admin';
    if (tourId === 'admin-map-management') return '/admin/map';
    if (tourId === 'admin-data-management') return '/admin/companies';
    // generic admin fallback
    return '/admin';
  }

  if (tourId.startsWith('visitor-')) {
    if (tourId === 'visitor-map') return '/map';
    if (tourId === 'visitor-exhibitors') return '/exhibitors';
    if (tourId === 'visitor-welcome') return '/';
    // generic visitor fallback
    return '/';
  }

  return null;
}
