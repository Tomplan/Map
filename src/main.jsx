import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import L from 'leaflet';

const baseUrl = import.meta.env.BASE_URL.endsWith('/')
  ? import.meta.env.BASE_URL
  : `${import.meta.env.BASE_URL}/`;

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

// Register service worker for offline support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const base = import.meta.env.BASE_URL.endsWith('/')
      ? import.meta.env.BASE_URL
      : `${import.meta.env.BASE_URL}/`;
    navigator.serviceWorker.register(`${base}service-worker.js`);
  });
}
