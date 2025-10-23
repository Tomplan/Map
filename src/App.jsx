import React, { Suspense, lazy, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import OfflineStatus from './components/OfflineStatus';
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
  const [branding, setBranding] = useState({
    logo: '',
    themeColor: '#2d3748',
    fontFamily: 'Montserrat, sans-serif',
    eventName: 'Event Map',
  });

  return (
    <Router>
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
                  <EventMap />
                </Suspense>
              </main>
              <BrandingSettings onChange={setBranding} />
            </ErrorBoundary>
          }
        />
        <Route
          path="/admin"
          element={
            <ErrorBoundary>
              <AdminDashboard />
              <div style={{ margin: '2rem 0' }}>
                <MarkerTable />
              </div>
            </ErrorBoundary>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
