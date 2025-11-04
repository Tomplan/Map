import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import L from 'leaflet';

L.Icon.Default.mergeOptions({
  iconRetinaUrl: `${import.meta.env.BASE_URL}assets/icons/marker-icon-2x.png`,
  iconUrl: `${import.meta.env.BASE_URL}assets/icons/glyph-marker-icon-blue.svg`, // or your preferred default
  shadowUrl: `${import.meta.env.BASE_URL}assets/icons/marker-shadow.png`,
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Register service worker for offline support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}service-worker.js`);
  });
}
