import React, { Suspense, lazy, useState, useEffect } from 'react';
import { getLogoPath } from './utils/getLogoPath';
import { supabase } from './supabaseClient';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import OfflineStatus from './components/OfflineStatus';
import useMarkersState from './hooks/useMarkersState';
import useEventMarkers from './hooks/useEventMarkers';
import BrandingBar from './components/BrandingBar';
import BrandingSettings from './components/BrandingSettings';
import Icon from '@mdi/react';
import './i18n';
import './App.css';
import AdminDashboard from './components/AdminDashboard';
import MarkerTable from './components/MarkerTable';

const EventMap = lazy(() => import('./components/EventMap.jsx'));
const AccessibilityToggle = lazy(() => import('./components/AccessibilityToggle'));
const FeedbackForm = lazy(() => import('./components/FeedbackForm'));
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    // Log the full error object for diagnosis
    console.error('ErrorBoundary caught:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ color: 'red', padding: '2rem', border: '2px solid blue' }}>
          <h2>Something went wrong in a component.</h2>
          <pre>{typeof this.state.error === 'string' ? this.state.error : JSON.stringify(this.state.error, null, 2)}</pre>
        </div>
      );
    }
    return (
  <div style={{ border: '2px solid blue', width: '100%', minHeight: '100vh', boxSizing: 'border-box', position: 'relative' }}>
        {this.props.children}
      </div>
    );
  }
}

function App() {
  // Fetch marker data from Supabase
  const { markers, loading, isOnline } = useEventMarkers();
  // Shared marker state for map and dashboard
  const [markersState, updateMarker, setMarkersState] = useMarkersState(markers);
  // Sync markersState whenever markers change
  useEffect(() => {
    if (Array.isArray(markers)) {
      setMarkersState(markers);
    }
  }, [markers, setMarkersState]);

  const [branding, setBranding] = useState({
    logo: `${import.meta.env.BASE_URL}assets/logos/4x4Vakantiebeurs.png`,
    themeColor: '#ffffff',
    fontFamily: 'Arvo, Sans-serif',
    eventName: '4x4 Vakantiebeurs',
    id: 1
  });

  // Fetch branding from Supabase and subscribe to changes
  useEffect(() => {
    async function fetchBranding() {
      const { data } = await supabase
        .from('Branding')
        .select('*')
        .eq('id', 1)
        .single();
      if (data) {
        // Normalize logo path from Supabase
        setBranding({
          ...data,
          logo: getLogoPath(data.logo)
        });
      }
    }
    fetchBranding();
    const channel = supabase
      .channel('branding-user-sync')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'Branding',
        filter: 'id=eq.1',
      }, payload => {
        if (payload.new) {
          setBranding({
            ...payload.new,
            logo: getLogoPath(payload.new.logo)
          });
        }
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <Router basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route
          path="/"
          element={
            <ErrorBoundary>
              <BrandingBar {...branding} />
              <main style={{ border: '2px solid red' }}>
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
              <AdminDashboard
                markersState={markersState}
                updateMarker={updateMarker}
                setMarkersState={setMarkersState}
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
                />
              </Suspense>
            </ErrorBoundary>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
