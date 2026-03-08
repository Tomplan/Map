import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

// Expose a small runtime bridge for build-time Vite env values early so any
// modules (including `supabaseClient`) that import before App are able to
// read the Vite-provided values from `globalThis` instead of relying on
// import.meta at runtime which can confuse test runners.
if (typeof globalThis !== 'undefined' && typeof import.meta !== 'undefined' && import.meta.env) {
  globalThis.__SUPABASE_CONFIG__ = {
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
  };
}

// Fix Supabase auth hashes when using HashRouter.
// If a user clicks an email link (like reset password or invite) and Supabase falls back to the Site URL
// or replaces the fragment, the hash might start with `#access_token=` instead of `#/reset-password`.
// This breaks HashRouter, routing the user to the visitor website (`/`) instead of the reset page.
if (typeof window !== 'undefined' && window.location.hash) {
  const hash = window.location.hash;
  if ((hash.includes('access_token=') || hash.includes('error=')) && !hash.startsWith('#/')) {
    // Redirect it properly to the reset-password route and append the token data
    window.location.hash = '#/reset-password' + hash;
  }
}

import App from './App.jsx';
import L from 'leaflet';
// `leaflet.browser.print` does not provide a package entry suitable for Vite's
// ESM resolution. Import the distributed bundle file directly so the plugin
// registers itself on the global Leaflet (`L.Control.BrowserPrint`) reliably.
import 'leaflet.browser.print/dist/leaflet.browser.print.min.js';
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
  };
}

// Register service worker for offline support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // When deploying to a subdirectory (like /Map/dev/), the service worker needs
    // to be registered with the correct scope.
    const swUrl = `${getBaseUrl()}service-worker.js`;
    navigator.serviceWorker
      .register(swUrl, { scope: getBaseUrl() })
      .then((registration) => {
        // console.log('SW register success:', registration);
      })
      .catch((registrationError) => {
        console.warn('SW register failed:', registrationError);
      });
  });
}
