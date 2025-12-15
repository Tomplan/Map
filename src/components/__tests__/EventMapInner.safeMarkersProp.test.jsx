import React from 'react';
import { render } from '@testing-library/react';

// Spy components
let clusterReceived = null;
let specialReceived = null;

jest.mock('../EventSpecialMarkers', () => (props) => {
  specialReceived = props;
  return require('react').createElement('div', { 'data-testid': 'special' });
});

jest.mock('../EventClusterMarkers', () => (props) => {
  clusterReceived = props;
  return require('react').createElement('div', { 'data-testid': 'cluster' });
});


// Stub heavy utilities that rely on Vite's import.meta during tests
jest.mock('../../utils/clusterIcons', () => ({ createIconCreateFunction: () => () => {} }));
jest.mock('../../utils/getLogoPath', () => ({ getLogoPath: () => '', getResponsiveLogoSources: () => [] }));
jest.mock('../../hooks/useAnalytics', () => () => ({ track: () => {} }));
jest.mock('../../hooks/useOrganizationSettings', () => () => ({ settings: {}, loading: false }));
jest.mock('../../hooks/useEventMapSettings', () => () => ({ settings: null, loading: false }));

import EventMapInner from '../EventMap/EventMapInner';

describe('EventMapInner props', () => {
  it('passes markersState as safeMarkers to marker components', () => {
    const markers = [{ id: 1, lat: 52, lng: 4 }, { id: 1005, lat: 53, lng: 5 }];
    render(<EventMapInner markersState={markers} />);

    expect(clusterReceived).toBeTruthy();
    expect(specialReceived).toBeTruthy();
    expect(clusterReceived.safeMarkers).toBe(markers);
    expect(specialReceived.safeMarkers).toBe(markers);
    // Ensure draggable helper is passed and callable
    expect(typeof clusterReceived.isMarkerDraggable).toBe('function');
    expect(typeof specialReceived.isMarkerDraggable).toBe('function');
    // MapControls wiring is intentionally kept external; we ensure markers props above.
  });
});
