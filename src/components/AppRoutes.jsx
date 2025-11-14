import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import ErrorBoundary from './ErrorBoundary';
import OfflineStatus from './OfflineStatus';
import BrandingBar from './BrandingBar';
import AdminDashboard from './AdminDashboard';
import MarkerTable from './MarkerTable';
import AdminLogin from './AdminLogin';
import StorageTestPage from './StorageTestPage';

const EventMap = lazy(() => import('./EventMap/EventMap.jsx'));
const AccessibilityToggle = lazy(() => import('./AccessibilityToggle'));
const FeedbackForm = lazy(() => import('./FeedbackForm'));

function AppRoutes({ branding, user, markersState, updateMarker, setMarkersState, onLogin, selectedYear, setSelectedYear }) {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <ErrorBoundary>
            <BrandingBar {...branding} />
            <main>
              <OfflineStatus />
              <Suspense fallback={<div>Loading accessibility options...</div>}>
                <AccessibilityToggle />
              </Suspense>
              <Suspense fallback={<div>Loading map...</div>}>
                <EventMap
                  isAdminView={false}
                  markersState={markersState}
                  updateMarker={updateMarker}
                  setMarkersState={setMarkersState}
                  selectedYear={selectedYear}
                />
              </Suspense>
            </main>
          </ErrorBoundary>
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
