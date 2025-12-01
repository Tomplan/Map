import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import L from 'leaflet';
import { getBaseUrl } from './utils/getBaseUrl';

const baseUrl = getBaseUrl();

L.Icon.Default.mergeOptions({
  iconRetinaUrl: `${baseUrl}assets/icons/marker-icon-2x.png`,
  iconUrl: `${baseUrl}assets/icons/glyph-marker-icon-blue.svg`, // or your preferred default
  shadowUrl: `${baseUrl}assets/icons/marker-shadow.png`,
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Expose a small runtime bridge for build-time Vite env values so code that
// can't directly reference import.meta.env (like test-transpiled files) can
// still access Vite-provided values via globalThis.__SUPABASE_CONFIG__.
// This will be compiled by Vite with real values in the browser.
if (typeof window !== 'undefined' && typeof import.meta !== 'undefined' && import.meta.env) {
  window.__SUPABASE_CONFIG__ = {
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
  }
}

// Register service worker for offline support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${getBaseUrl()}service-worker.js`);
  });
}
