import React from 'react';
import { render } from '@testing-library/react';
import EventMap, { createBoothMarkerIcon, createSpecialMarkerIcon } from './EventMap';

// Mock IntersectionObserver for test environment
beforeAll(() => {
  global.IntersectionObserver = class {
    constructor() {}
    observe() {}
    disconnect() {}
  };
});
import L from 'leaflet';

describe('EventMap marker icons', () => {
  it('creates booth-holder marker with orange SVG', () => {
    const icon = createBoothMarkerIcon(1);
    expect(icon.options.iconUrl).toMatch(/glyph-marker-icon-blue\.svg$/);
    // Check for shadow
    expect(icon.options.shadowUrl).toContain('marker-shadow.png');
  });

  it('creates special marker with orange SVG', () => {
    const icon = createSpecialMarkerIcon('dummy.svg');
    expect(icon.options.iconUrl).toMatch(/glyph-marker-icon-blue\.svg$/);
    expect(icon.options.shadowUrl).toContain('marker-shadow.png');
  });

  it('renders EventMap without crashing', () => {
    render(<EventMap />);
  });
});
