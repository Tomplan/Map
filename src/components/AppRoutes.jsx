import React, { Suspense, lazy, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import ErrorBoundary from './ErrorBoundary';
import { useLocation } from 'react-router-dom';
import { useOnboarding } from '../contexts/OnboardingContext';
import { getAllAdminTours } from '../config/tourSteps/adminTourSteps';
import { getAllVisitorTours } from '../config/tourSteps/visitorTourSteps';
import OfflineStatus from './OfflineStatus';
import BrandingBar from './BrandingBar';
import { FavoritesProvider } from '../contexts/FavoritesContext';
import TabNavigation from './TabNavigation';

// Lazy load heavy components to reduce initial bundle size
const EventMap = lazy(() => import('./EventMap/EventMap.jsx'));
const AccessibilityToggle = lazy(() => import('./AccessibilityToggle'));
const FeedbackForm = lazy(() => import('./FeedbackForm'));
const ResetPassword = lazy(() => import('./ResetPassword'));
const AdminLogin = lazy(() => import('./AdminLogin'));
const StorageTestPage = lazy(() => import('./StorageTestPage'));
const HomePage = lazy(() => import('./HomePage'));
const ExcelImportExportDemo = lazy(() => import('./ExcelImportExport'));
const ExhibitorListView = lazy(() => import('./ExhibitorListView'));
const EventSchedule = lazy(() => import('./EventSchedule'));
const AdminLayout = lazy(() => import('./AdminLayout'));

// Admin components - only load when needed
const Dashboard = lazy(() => import('./admin/Dashboard'));
const MapManagement = lazy(() => import('./admin/MapManagement'));
const CompaniesTab = lazy(() => import('./admin/CompaniesTab'));
const EventSubscriptionsTab = lazy(() => import('./admin/EventSubscriptionsTab'));
const ProgramManagement = lazy(() => import('./ProgramManagement'));
const AssignmentsTab = lazy(() => import('./admin/AssignmentsTab'));
const CategoryManagement = lazy(() => import('./admin/CategoryManagement'));
const Settings = lazy(() => import('./admin/Settings'));
const FeedbackRequests = lazy(() => import('./admin/FeedbackRequests'));

function AppRoutes({
  branding,
  user,
  markersState,
  updateMarker,
  deleteMarker,
  setMarkersState,
  undo,
  canUndo,
  redo,
  canRedo,
  onLogin,
  selectedYear,
  setSelectedYear,
  publicYear,
  archiveMarkers,
  copyMarkers,
  assignmentsState,
  markerHistoryStack,
  markerRedoStack,
}) {
  const location = useLocation();
  const { startTour } = useOnboarding();

  // If a tab has previously requested a tour start after navigation
  // (set by the Help panel before performing a redirect), read the
  // session flag here and start the tour once the destination route
  // has been mounted and matches the requested tour path.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('onboarding:startAfterNav');
      if (!raw) return;
      const payload = JSON.parse(raw);
      if (!payload?.id) {
        sessionStorage.removeItem('onboarding:startAfterNav');
        return;
      }

      const allTours = [...getAllVisitorTours(), ...getAllAdminTours()];
      const config = allTours.find((t) => t.id === payload.id);
      if (!config) {
        sessionStorage.removeItem('onboarding:startAfterNav');
        return;
      }

      const normalize = (p) => (p ? (p.startsWith('#') ? p.substring(1) : p) : '');
      const currentHash = normalize(location.hash || '');
      const currentPath = normalize(location.pathname || '');
      const target = normalize(config.path || '');

      // Only start when we've arrived on the expected path
      if (currentHash === target || currentPath.endsWith(target) || currentPath === target) {
        startTour(config.id, payload.source);
        sessionStorage.removeItem('onboarding:startAfterNav');
      }
    } catch (e) {
      // Failure is non-fatal; clean up the session key to avoid retry loops
      try {
        sessionStorage.removeItem('onboarding:startAfterNav');
      } catch (e2) {}
    }
    // Run when location changes / mounts
  }, [location.pathname, location.hash, startTour]);
  // Shared visitor layout with offline status, favorites context, and tab navigation
  // Mobile-only design - bottom tabs always visible
  const VisitorLayout = ({ children }) => (
    <ErrorBoundary>
      <FavoritesProvider selectedYear={user ? selectedYear : publicYear}>
        <OfflineStatus />
        <main className="pb-16">{children}</main>
        <TabNavigation />
      </FavoritesProvider>
    </ErrorBoundary>
  );

  return (
    <Routes>
      {/* Visitor Routes with Tab Navigation */}
      <Route
        path="/"
        element={
          <VisitorLayout>
            <Suspense
              fallback={
                <div className="flex items-center justify-center min-h-screen">Loading...</div>
              }
            >
              <HomePage selectedYear={user ? selectedYear : publicYear} branding={branding} />
            </Suspense>
          </VisitorLayout>
        }
      />
      <Route
        path="/map"
        element={
          <VisitorLayout>
            <Suspense fallback={<div>Loading map...</div>}>
              <EventMap
                isAdminView={false}
                markersState={markersState}
                updateMarker={updateMarker}
                setMarkersState={setMarkersState}
                // If logged in, show the currently selected admin year.
                // Otherwise show the resolved public year.
                selectedYear={user ? selectedYear : publicYear}
              />
            </Suspense>
          </VisitorLayout>
        }
      />
      <Route
        path="/exhibitors"
        element={
          <VisitorLayout>
            <Suspense
              fallback={
                <div className="flex items-center justify-center min-h-screen">
                  Loading exhibitors...
                </div>
              }
            >
              <ExhibitorListView
                markersState={markersState}
                selectedYear={user ? selectedYear : publicYear}
              />
            </Suspense>
          </VisitorLayout>
        }
      />
      <Route
        path="/dev/excel"
        element={
          <VisitorLayout>
            <Suspense
              fallback={
                <div className="flex items-center justify-center min-h-screen">Loading...</div>
              }
            >
              <ExcelImportExportDemo />
            </Suspense>
          </VisitorLayout>
        }
      />
      <Route
        path="/schedule"
        element={
          <VisitorLayout>
            <Suspense
              fallback={
                <div className="flex items-center justify-center min-h-screen">
                  Loading schedule...
                </div>
              }
            >
              <EventSchedule selectedYear={user ? selectedYear : publicYear} />
            </Suspense>
          </VisitorLayout>
        }
      />
      {/* Password Reset Route - No auth required */}
      <Route
        path="/reset-password"
        element={
          <ErrorBoundary>
            <Suspense
              fallback={
                <div className="min-h-screen flex items-center justify-center">Loading...</div>
              }
            >
              <ResetPassword branding={branding} />
            </Suspense>
          </ErrorBoundary>
        }
      />
      {/* Admin Routes - Conditional rendering based on auth */}
      <Route
        path="/admin"
        element={
          user ? (
            <FavoritesProvider selectedYear={selectedYear}>
              <Suspense
                fallback={
                  <div className="min-h-screen flex items-center justify-center">
                    Loading admin...
                  </div>
                }
              >
                <AdminLayout selectedYear={selectedYear} setSelectedYear={setSelectedYear} />
              </Suspense>
            </FavoritesProvider>
          ) : (
            <ErrorBoundary>
              <Suspense
                fallback={
                  <div className="min-h-screen flex items-center justify-center">Loading...</div>
                }
              >
                <AdminLogin onLogin={onLogin} branding={branding} />
              </Suspense>
            </ErrorBoundary>
          )
        }
      >
        <Route
          index
          element={
            <Suspense fallback={<div className="p-4">Loading dashboard...</div>}>
              <Dashboard selectedYear={selectedYear} setSelectedYear={setSelectedYear} />
            </Suspense>
          }
        />
        <Route
          path="map"
          element={
            <Suspense fallback={<div className="p-4">Loading map management...</div>}>
              <MapManagement
                markersState={markersState}
                setMarkersState={setMarkersState}
                updateMarker={updateMarker}
                deleteMarker={deleteMarker}
                undo={undo}
                canUndo={canUndo}
                redo={redo}
                canRedo={canRedo}
                assignmentsState={assignmentsState}
                selectedYear={selectedYear}
                archiveMarkers={archiveMarkers}
                copyMarkers={copyMarkers}
                markerHistoryStack={markerHistoryStack}
                markerRedoStack={markerRedoStack}
              />
            </Suspense>
          }
        />
        <Route
          path="companies"
          element={
            <Suspense fallback={<div className="p-4">Loading companies...</div>}>
              <CompaniesTab />
            </Suspense>
          }
        />
        <Route
          path="subscriptions"
          element={
            <Suspense fallback={<div className="p-4">Loading subscriptions...</div>}>
              <EventSubscriptionsTab selectedYear={selectedYear} />
            </Suspense>
          }
        />
        <Route
          path="program"
          element={
            <Suspense fallback={<div className="p-4">Loading program...</div>}>
              <ProgramManagement selectedYear={selectedYear} />
            </Suspense>
          }
        />
        <Route
          path="assignments"
          element={
            <Suspense fallback={<div className="p-4">Loading assignments...</div>}>
              <AssignmentsTab selectedYear={selectedYear} />
            </Suspense>
          }
        />
        <Route
          path="categories"
          element={
            <Suspense fallback={<div className="p-4">Loading categories...</div>}>
              <CategoryManagement />
            </Suspense>
          }
        />
        <Route
          path="settings"
          element={
            <Suspense fallback={<div className="p-4">Loading settings...</div>}>
              <Settings selectedYear={selectedYear} setSelectedYear={setSelectedYear} />
            </Suspense>
          }
        />
        <Route
          path="feedback"
          element={
            <Suspense fallback={<div className="p-4">Loading feedback...</div>}>
              <FeedbackRequests />
            </Suspense>
          }
        />
      </Route>
      <Route
        path="/storage-test"
        element={
          <Suspense
            fallback={
              <div className="min-h-screen flex items-center justify-center">
                Loading test page...
              </div>
            }
          >
            <StorageTestPage />
          </Suspense>
        }
      />
    </Routes>
  );
}

export default AppRoutes;
