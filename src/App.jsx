import React, { Suspense, lazy, useState } from 'react';
import OfflineStatus from './components/OfflineStatus';
import Icon from '@mdi/react';
import './i18n';
import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
import './App.css';
import { mdiHome } from '@mdi/js';

const EventMap = lazy(() => import('./components/EventMap'));
const AccessibilityToggle = lazy(() => import('./components/AccessibilityToggle'));
const FeedbackForm = lazy(() => import('./components/FeedbackForm'));
function App() {
  const [count, setCount] = useState(0);
  return (
    <main>
      <OfflineStatus />
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
      <h1 className="bg-green-500 text-white p-4 rounded" aria-label="App Title">Vite + React</h1>
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
    </main>
  );
}

export default App;
