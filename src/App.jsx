import React, { Suspense, lazy, useState } from 'react';

import OfflineStatus from './components/OfflineStatus';
import BrandingBar from './components/BrandingBar';
import BrandingSettings from './components/BrandingSettings';
import Icon from '@mdi/react';
import './i18n';
import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
import './App.css';
import { mdiHome } from '@mdi/js';
import AdminDashboard from './components/AdminDashboard';

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
        <div style={{ color: 'red', padding: '2rem' }}>
          <h2>Something went wrong in a component.</h2>
          <pre>{typeof this.state.error === 'string' ? this.state.error : JSON.stringify(this.state.error, null, 2)}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  const [count, setCount] = useState(0);
  const [branding, setBranding] = useState({
    logo: reactLogo,
    themeColor: '#2d3748',
    fontFamily: 'Montserrat, sans-serif',
  });
  const [showAdmin, setShowAdmin] = useState(false);
  return (
    <ErrorBoundary>
      <BrandingBar {...branding} />
      <BrandingSettings onChange={setBranding} />
      <main>
        <OfflineStatus />
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setShowAdmin((v) => !v)}
            className="px-4 py-2 bg-blue-500 text-white rounded shadow"
            aria-label={showAdmin ? 'Show Map' : 'Show Admin Dashboard'}
          >
            {showAdmin ? 'User Map View' : 'Admin Dashboard'}
          </button>
        </div>
        {showAdmin ? (
          <AdminDashboard />
        ) : (
          <>
            <Suspense fallback={<div>Loading accessibility options...</div>}>
              <AccessibilityToggle />
            </Suspense>
            <Suspense fallback={<div>Loading map...</div>}>
              <EventMap />
            </Suspense>
            <div>
              <a href="https://vite.dev" target="_blank">
                {viteLogo ? (
                  <img src={viteLogo} className="logo" alt="Vite logo" loading="lazy" />
                ) : null}
              </a>
              <a href="https://react.dev" target="_blank">
                {reactLogo ? (
                  <img src={reactLogo} className="logo react" alt="React logo" loading="lazy" />
                ) : null}
              </a>
              <div className="flex justify-center my-4">
                <span className="inline-block">
                  <Icon path={mdiHome} size={3} color="green" role="presentation" />
                </span>
              </div>
            </div>
            <div className="card">
              <button onClick={() => setCount((count) => count + 1)} aria-label={`Count is ${count}`}>
                count is {count}
              </button>
              <p>
                Edit <code>src/App.jsx</code> and save to test HMR
              </p>
            </div>
            <Suspense fallback={<div>Loading feedback form...</div>}>
              <FeedbackForm />
            </Suspense>
            <p className="read-the-docs">
              Click on the Vite and React logos to learn more
            </p>
          </>
        )}
      </main>
    </ErrorBoundary>
  );
}

export default App;
