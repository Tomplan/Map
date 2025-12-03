import React from 'react';
import Icon from '@mdi/react';
import { mdiLayersTriple } from '@mdi/js';
import { MdAdd, MdRemove, MdHome } from 'react-icons/md';
import {
  handleZoomIn,
  handleZoomOut,
  handleHome,
  handleCustomSearchClick,
} from '../../utils/MapControls';
import PrintButton from '../PrintButton';

const checkboxStyle = {
  appearance: 'none',
  WebkitAppearance: 'none',
  MozAppearance: 'none',
  outline: 'none',
  background: '#fff',
  border: '2px solid #1976d2',
  borderRadius: 4,
  width: 18,
  height: 18,
  display: 'inline-block',
  position: 'relative',
  marginRight: 8,
  cursor: 'pointer',
  verticalAlign: 'middle',
};

export default function MapControls({
  mapInstance,
  mapCenter,
  mapZoom,
  searchControlRef,
  isAdminView,
  showLayersMenu,
  setShowLayersMenu,
  activeLayer,
  setActiveLayer,
  showRectanglesAndHandles,
  setShowRectanglesAndHandles,
  MAP_LAYERS,
}) {
  const zoomIn = () => handleZoomIn(mapInstance);
  const zoomOut = () => handleZoomOut(mapInstance);
  const goHome = () => handleHome(mapInstance, mapCenter, mapZoom);
  const customSearchClick = () => handleCustomSearchClick(searchControlRef);

  return (
    <div
      className="map-controls-print-hide"
      style={{
        position: 'absolute',
        top: 10,
        right: 10,
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
    >
      <button
        onClick={goHome}
        aria-label="Home"
        className="bg-white rounded-full shadow p-2 flex items-center justify-center"
        style={{ width: 44, height: 44 }}
      >
        <MdHome size={28} color="#1976d2" aria-hidden="true" />
        <span className="sr-only">Home</span>
      </button>
      <button
        onClick={zoomIn}
        aria-label="Zoom in"
        className="bg-white rounded-full shadow p-2 mb-2 flex items-center justify-center"
        style={{ width: 44, height: 44 }}
      >
        <MdAdd size={28} color="#1976d2" aria-hidden="true" />
        <span className="sr-only">Zoom in</span>
      </button>
      <button
        onClick={zoomOut}
        aria-label="Zoom out"
        className="bg-white rounded-full shadow p-2 mb-2 flex items-center justify-center"
        style={{ width: 44, height: 44 }}
      >
        <MdRemove size={28} color="#1976d2" aria-hidden="true" />
        <span className="sr-only">Zoom out</span>
      </button>
      {/* Print button intentionally hidden — the top header Print Map is the canonical entry point.
          Keep the code available for future removal or re-enablement, but do not render the map-embedded
          PrintButton in UI at this time. */}
      {false && isAdminView && <PrintButton mapInstance={mapInstance} />}

      {/* Admin layers button and popover */}
      {isAdminView && (
        <div style={{ position: 'relative' }}>
          <button
            aria-label="Map layers"
            className="bg-white rounded-full shadow p-2 flex items-center justify-center mt-0 hover:bg-gray-100 focus:outline-none"
            style={{ width: 44, height: 44 }}
            onClick={() => setShowLayersMenu((v) => !v)}
          >
            <Icon path={mdiLayersTriple} size={1.2} color="#1976d2" />
            <span className="sr-only">Map layers</span>
          </button>
          {showLayersMenu && (
            <div
              className="absolute right-0 mt-2 bg-white rounded shadow-lg border z-50"
              style={{ minWidth: 200, padding: 8, color: '#1976d2' }}
              role="menu"
              aria-label="Layer selection"
            >
              <div className="font-semibold mb-2">Base Layers</div>
              {MAP_LAYERS.map((layer) => (
                <button
                  key={layer.key}
                  className={`w-full text-left px-2 py-1 rounded hover:bg-blue-50 ${
                    activeLayer === layer.key ? 'bg-blue-50 font-bold' : ''
                  }`}
                  onClick={() => setActiveLayer(layer.key)}
                  role="menuitem"
                  style={{ color: '#1976d2' }}
                >
                  {layer.name}
                </button>
              ))}
              <div className="font-semibold mt-4 mb-2">Map Features</div>
              <label
                className="flex items-center px-2 py-1 cursor-pointer hover:bg-blue-50 rounded"
                style={{ color: '#1976d2' }}
              >
                <input
                  type="checkbox"
                  checked={showRectanglesAndHandles}
                  onChange={(e) => setShowRectanglesAndHandles(e.target.checked)}
                  style={checkboxStyle}
                />
                <span
                  style={{
                    position: 'relative',
                    left: -26,
                    width: 18,
                    height: 18,
                    pointerEvents: 'none',
                    display: showRectanglesAndHandles ? 'inline-block' : 'none',
                  }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 18 18"
                    style={{ position: 'absolute', top: 0, left: 0 }}
                  >
                    <polyline
                      points="4,9 8,13 14,5"
                      stroke="#1976d2"
                      strokeWidth="2.5"
                      fill="none"
                    />
                  </svg>
                </span>
                <span style={{ marginLeft: showRectanglesAndHandles ? -8 : 0 }}>
                  Booth Surface
                </span>
              </label>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
