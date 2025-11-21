import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import ErrorBoundary from './ErrorBoundary';
import OfflineStatus from './OfflineStatus';
import BrandingBar from './BrandingBar';
import AdminLogin from './AdminLogin';
import ResetPassword from './ResetPassword';
import StorageTestPage from './StorageTestPage';
import TabNavigation from './TabNavigation';
import HomePage from './HomePage';
import ExhibitorListView from './ExhibitorListView';
import EventSchedule from './EventSchedule';
import { FavoritesProvider } from '../contexts/FavoritesContext';
import AdminLayout from './AdminLayout';
import Dashboard from './admin/Dashboard';
import MapManagement from './admin/MapManagement';
import CompaniesTab from './admin/CompaniesTab';
import EventSubscriptionsTab from './admin/EventSubscriptionsTab';
import AssignmentsTab from './admin/AssignmentsTab';
import Settings from './admin/Settings';

const EventMap = lazy(() => import('./EventMap/EventMap.jsx'));
const AccessibilityToggle = lazy(() => import('./AccessibilityToggle'));
const FeedbackForm = lazy(() => import('./FeedbackForm'));

function AppRoutes({ branding, user, markersState, updateMarker, setMarkersState, onLogin, selectedYear, setSelectedYear }) {
  // Shared visitor layout with offline status, favorites context, and tab navigation
  // Mobile-only design - bottom tabs always visible
  const VisitorLayout = ({ children }) => (
    <ErrorBoundary>
      <FavoritesProvider selectedYear={selectedYear}>
        <OfflineStatus />
        <main className="pb-16">
          {children}
        </main>
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
      {/* Password Reset Route - No auth required */}
      <Route
        path="/reset-password"
        element={
          <ErrorBoundary>
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
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
              <AdminLayout selectedYear={selectedYear} setSelectedYear={setSelectedYear} />
            </FavoritesProvider>
          ) : (
            <ErrorBoundary>
              <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
                <AdminLogin onLogin={onLogin} branding={branding} />
              </Suspense>
            </ErrorBoundary>
          )
        }
      >
        <Route index element={<Dashboard selectedYear={selectedYear} />} />
        <Route
          path="map"
          element={
            <MapManagement
              markersState={markersState}
              setMarkersState={setMarkersState}
              updateMarker={updateMarker}
              selectedYear={selectedYear}
            />
          }
        />
        <Route path="companies" element={<CompaniesTab />} />
        <Route
          path="subscriptions"
          element={<EventSubscriptionsTab selectedYear={selectedYear} />}
        />
        <Route
          path="assignments"
          element={<AssignmentsTab selectedYear={selectedYear} />}
        />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="/storage-test" element={<StorageTestPage />} />

    </Routes>
  );
}

export default AppRoutes;
