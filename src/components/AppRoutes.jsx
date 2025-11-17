import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import ErrorBoundary from './ErrorBoundary';
import OfflineStatus from './OfflineStatus';
import BrandingBar from './BrandingBar';
import AdminDashboard from './AdminDashboard';
import MarkerTable from './MarkerTable';
import AdminLogin from './AdminLogin';
import StorageTestPage from './StorageTestPage';
import TabNavigation from './TabNavigation';
import HomePage from './HomePage';
import ExhibitorListView from './ExhibitorListView';
import EventSchedule from './EventSchedule';

const EventMap = lazy(() => import('./EventMap/EventMap.jsx'));
const AccessibilityToggle = lazy(() => import('./AccessibilityToggle'));
const FeedbackForm = lazy(() => import('./FeedbackForm'));

function AppRoutes({ branding, user, markersState, updateMarker, setMarkersState, onLogin, selectedYear, setSelectedYear }) {
  // Shared visitor layout with branding bar, offline status, and tab navigation
  const VisitorLayout = ({ children }) => (
    <ErrorBoundary>
      <BrandingBar {...branding} />
      <OfflineStatus />
      <Suspense fallback={<div>Loading accessibility options...</div>}>
        <AccessibilityToggle />
      </Suspense>
      <main className="pb-16 md:pb-0">
        {children}
      </main>
      <TabNavigation />
    </ErrorBoundary>
  );

  return (
    <Routes>
      {/* Visitor Routes with Tab Navigation */}
      <Route
        path="/"
        element={
          <VisitorLayout>
            <HomePage selectedYear={selectedYear} branding={branding} />
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
                selectedYear={selectedYear}
              />
            </Suspense>
          </VisitorLayout>
        }
      />
      <Route
        path="/exhibitors"
        element={
          <VisitorLayout>
            <ExhibitorListView
              markersState={markersState}
              selectedYear={selectedYear}
            />
          </VisitorLayout>
        }
      />
      <Route
        path="/schedule"
        element={
          <VisitorLayout>
            <EventSchedule selectedYear={selectedYear} />
          </VisitorLayout>
        }
      />
      <Route
        path="/admin"
        element={
          <ErrorBoundary>
            <BrandingBar {...branding} />
            {user ? (
              <>
                <AdminDashboard
                  markersState={markersState}
                  updateMarker={updateMarker}
                  setMarkersState={setMarkersState}
                  selectedYear={selectedYear}
                  setSelectedYear={setSelectedYear}
                />
                <div style={{ margin: '2rem 0' }}>
                  <MarkerTable />
                </div>
                <Suspense fallback={<div>Loading map...</div>}>
                  <EventMap
                    isAdminView={true}
                    markersState={markersState}
                    updateMarker={updateMarker}
                    setMarkersState={setMarkersState}
                    selectedYear={selectedYear}
                  />
                </Suspense>
              </>
            ) : (
              <Suspense fallback={<div>Loading login...</div>}>
                <FeedbackForm />
                <AdminLogin onLogin={onLogin} />
              </Suspense>
            )}
          </ErrorBoundary>
        }
      />
      <Route path="/storage-test" element={<StorageTestPage />} />

    </Routes>
  );
}

export default AppRoutes;
