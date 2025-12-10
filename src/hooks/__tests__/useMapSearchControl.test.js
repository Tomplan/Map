import React from 'react';
import { render, act, waitFor } from '@testing-library/react';

// Mock a minimal subset of Leaflet used by the hook so tests can run
const controlHandlers = {};

const mockMarker = jest.fn((latlng) => ({
  bindPopup: jest.fn(),
  feature: null,
}));

const mockLayerGroup = jest.fn(() => ({
  addLayer: jest.fn(),
}));

jest.mock('leaflet', () => ({
  marker: (latlng, opts) => mockMarker(latlng, opts),
  layerGroup: () => mockLayerGroup(),
  Control: {
    Search: jest.fn((opts) => ({
      on: (event, cb) => {
        controlHandlers[event] = cb;
      },
      off: jest.fn(),
      _input: { blur: jest.fn() },
      hideAlert: jest.fn(),
      collapse: jest.fn(),
      _markerSearch: { remove: jest.fn() },
    })),
  },
}));

// Prevent importing import.meta env usage in test environment by mocking config
jest.mock('../../config/mapConfig', () => ({ MAP_CONFIG: { SEARCH_ZOOM: 16 } }));

import { useMapSearchControl } from '../useMapSearchControl';

function TestHost({ map, markers }) {
  // simple host component that mounts the hook
  useMapSearchControl(map, markers);
  return <div />;
}

describe('useMapSearchControl', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(controlHandlers).forEach((k) => delete controlHandlers[k]);
  });

  test('does not remove highlight after moveend/zoomend (circle should remain visible after search flyTo)', async () => {
    const listeners = {};

    const mapInstance = {
      addControl: jest.fn(),
      removeControl: jest.fn(),
      flyTo: jest.fn(),
      once: jest.fn((event, handler) => {
        listeners[event] = handler;
      }),
      on: jest.fn((event, handler) => {
        listeners[event] = handler;
      }),
      off: jest.fn((event, handler) => {
        if (listeners[event] === handler) delete listeners[event];
      }),
      hasLayer: jest.fn(() => true),
      removeLayer: jest.fn(),
    };

    const markers = [{ id: 1, lat: 10, lng: 20, name: 'Company' }];

    // Render host that uses the hook
    await act(async () => {
      render(<TestHost map={mapInstance} markers={markers} />);
    });

    // ensure control was added
    await waitFor(() => expect(mapInstance.addControl).toHaveBeenCalled());

    // Simulate a search:locationfound event fired by the plugin
    expect(typeof controlHandlers['search:locationfound']).toBe('function');

    act(() => {
      controlHandlers['search:locationfound']({
        layer: { getLatLng: () => ({ lat: 10, lng: 20 }) },
      });
    });

    // FlyTo should have been called
    expect(mapInstance.flyTo).toHaveBeenCalled();

    // UI helpers on the control should have been called
    const leaflet = require('leaflet');
    const controlInstance = leaflet.Control.Search.mock.results[0].value;
    expect(controlInstance._input.blur).toHaveBeenCalled();
    expect(controlInstance.hideAlert).toHaveBeenCalled();
    expect(controlInstance.collapse).toHaveBeenCalled();

    // If moveend/zoomend happens after the flyTo, the highlight should still be
    // visible — we only remove when a user manually zooms again.
    act(() => {
      // fire moveend and zoomend if handlers exist
      listeners.moveend?.();
      listeners.zoomend?.();
    });

    expect(mapInstance.removeLayer).not.toHaveBeenCalled();
  });

  test('removes plugin highlight when user zooms after a search', async () => {
    const listeners = {};

    const mapInstance = {
      addControl: jest.fn(),
      removeControl: jest.fn(),
      flyTo: jest.fn(),
      once: jest.fn((event, handler) => {
        listeners[event] = handler;
      }),
      on: jest.fn((event, handler) => {
        listeners[event] = handler;
      }),
      off: jest.fn((event, handler) => {
        if (listeners[event] === handler) delete listeners[event];
      }),
      hasLayer: jest.fn(() => true),
      removeLayer: jest.fn(),
    };

    const markers = [{ id: 2, lat: 11, lng: 21, name: 'Another' }];

    await act(async () => {
      render(<TestHost map={mapInstance} markers={markers} />);
    });

    await waitFor(() => expect(mapInstance.addControl).toHaveBeenCalled());

    act(() => {
      controlHandlers['search:locationfound']({
        layer: { getLatLng: () => ({ lat: 11, lng: 21 }) },
      });
    });

    // Simulate user starting a manual zoom action after the search
    act(() => {
      listeners.zoomstart?.();
    });

    const leaflet = require('leaflet');
    const controlInstance = leaflet.Control.Search.mock.results[0].value;
    expect(mapInstance.removeLayer).toHaveBeenCalledWith(controlInstance._markerSearch);
  });
});
