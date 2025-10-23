import React, { Suspense, lazy, useState } from 'react';

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
  });
  const [showAdmin, setShowAdmin] = useState(false);
  return (
    <ErrorBoundary>
  <BrandingBar {...branding} />
  {showAdmin && <BrandingSettings onChange={setBranding} />}
  <main style={{ border: '2px solid red' }}>
        <OfflineStatus />
        {/* Admin toggle button always visible, fixed top right */}
        <button
          onClick={() => setShowAdmin((v) => !v)}
          style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 2000 }}
          className="px-4 py-2 bg-blue-500 text-white rounded shadow"
          aria-label={showAdmin ? 'Show Map' : 'Show Admin Dashboard'}
        >
          {showAdmin ? 'User Map View' : 'Admin Dashboard'}
        </button>
        {showAdmin ? (
          <>
            <AdminDashboard />
            <div style={{ margin: '2rem 0' }}>
              <MarkerTable />
            </div>
          </>
        ) : (
          <>
            <Suspense fallback={<div>Loading accessibility options...</div>}>
              <AccessibilityToggle />
            </Suspense>
            <Suspense fallback={<div>Loading map...</div>}>
              <EventMap />
            </Suspense>
            <div>
            </div>
          </>
        )}
      </main>
    </ErrorBoundary>
  );
}

export default App;
