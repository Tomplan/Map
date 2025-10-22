import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import EventMap from './EventMap';

// Mock IntersectionObserver for visibility
beforeAll(() => {
  global.IntersectionObserver = class {
    constructor() {}
    observe() {}
    disconnect() {}
  };
});

describe('EventMap marker rendering', () => {
  test('booth-holder marker uses SVG icon', () => {
    const { createBoothMarkerIcon } = require('./EventMap');
    const icon = createBoothMarkerIcon(1);
    // icon.options.iconUrl should match the SVG asset
    expect(icon.options.iconUrl).toMatch(/glyph-marker-icon-blue\.svg$/);
    expect(icon.options.iconSize).toEqual([25, 41]);
    expect(icon.options.iconAnchor).toEqual([12, 41]);
  });
  test('loads marker data for main locations', async () => {
    // Test component to expose marker data
    function MarkerTestComponent({ onLoaded }) {
      const { markers, loading } = require('../hooks/useEventMarkers').default();
      React.useEffect(() => {
        if (!loading) {
          onLoaded(markers);
        }
      }, [loading, markers, onLoaded]);
      return null;
    }

    let loadedMarkers = null;
    const handleLoaded = markers => { loadedMarkers = markers; };
    render(<MarkerTestComponent onLoaded={handleLoaded} />);
    // Wait for marker data to load
    await new Promise(r => setTimeout(r, 600));
    expect(loadedMarkers).not.toBeNull();
    const labels = loadedMarkers.map(m => m.label);
    expect(labels).toContain('Main Stage');
    expect(labels).toContain('Food Court');
    // Check for duplicates
    const uniqueLabels = new Set(labels);
    expect(uniqueLabels.size).toBe(labels.length);
  });
});

// Note: Testing search control functionality requires browser automation (Cypress/Playwright)
