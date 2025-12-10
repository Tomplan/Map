import React from 'react';
import { render } from '@testing-library/react';

jest.mock('react-leaflet', () => ({
  Marker: ({ children }) =>
    require('react').createElement('div', { 'data-testid': 'marker' }, children),
  Popup: ({ children }) =>
    require('react').createElement('div', { 'data-testid': 'popup' }, children),
}));

jest.mock('../../hooks/useIsMobile', () => () => false);
jest.mock('../../contexts/OrganizationLogoContext', () => ({
  useOrganizationLogo: () => ({ organizationLogo: null, loading: false }),
}));
jest.mock('../../hooks/useEventSubscriptions', () => () => ({ subscriptions: [] }));
jest.mock('../../hooks/useAssignments', () => () => ({
  assignments: [],
  assignCompanyToMarker: async () => {},
  unassignCompanyFromMarker: async () => {},
}));
jest.mock('../../contexts/DialogContext', () => ({
  useDialog: () => ({ confirm: async () => true }),
}));

// Spy on getIconSizeForZoom
const mockGetIconSizeForZoom = jest.fn(() => [10, 20]);
jest.mock('../../utils/markerSizing', () => ({
  getIconSizeForZoom: (...args) => mockGetIconSizeForZoom(...args),
}));

const mockCreate = jest.fn(() => ({ _iconObject: true }));
jest.mock('../../utils/markerIcons', () => ({
  createMarkerIcon: (...args) => mockCreate(...args),
}));

jest.mock('../../utils/getIconPath', () => ({
  getIconPath: (file) => `/assets/${file || 'default.svg'}`,
}));
jest.mock('../../utils/getDefaultLogo', () => ({
  getLogoWithFallback: (logo, org) => logo || org || '/assets/default-logo.png',
}));
jest.mock('../MobileBottomSheet', () => () => null);
jest.mock('../MarkerDetailsUI', () => ({ MarkerUI: () => null }));
jest.mock('../MarkerContextMenu', () => () => null);

import EventSpecialMarkers from '../EventSpecialMarkers';

describe('EventSpecialMarkers — base size source', () => {
  it('uses marker.iconSize as base size for special markers', () => {
    const markers = [
      { id: 1001, lat: 52.0, lng: 4.0, type: 'special', iconSize: [30, 60], iconBaseSize: [5, 10] },
    ];

    const props = {
      safeMarkers: markers,
      updateMarker: jest.fn(),
      isMarkerDraggable: () => false,
      selectedYear: 2025,
      isAdminView: false,
      currentZoom: 16,
    };

    render(<EventSpecialMarkers {...props} />);

    expect(mockGetIconSizeForZoom).toHaveBeenCalled();
    const calledArgs = mockGetIconSizeForZoom.mock.calls[0];
    expect(calledArgs[1]).toEqual([30, 60]);
  });

  it('computes missing icon height from width for special marker iconSize with only width', () => {
    const markers = [{ id: 1002, lat: 52.0, lng: 4.0, type: 'special', iconSize: [30] }];

    const props = {
      safeMarkers: markers,
      updateMarker: jest.fn(),
      isMarkerDraggable: () => false,
      selectedYear: 2025,
      isAdminView: false,
      currentZoom: 16,
    };

    render(<EventSpecialMarkers {...props} />);

    // The special default fallback is [17,28] so height should be round(30 * 28/17) = 49
    expect(mockGetIconSizeForZoom).toHaveBeenCalled();
    const calledArgs =
      mockGetIconSizeForZoom.mock.calls[mockGetIconSizeForZoom.mock.calls.length - 1];
    expect(calledArgs[1]).toEqual([30, 49]);
  });

  it('scales explicit glyphSize (px) relative to marker.iconSize height for special markers', () => {
    // Force icon size returned for zoom to be [15,30]
    mockGetIconSizeForZoom.mockReturnValueOnce([15, 30]);

    const markers = [
      { id: 1003, lat: 52.0, lng: 4.0, type: 'special', iconSize: [30, 60], glyphSize: '10px' },
    ];

    const props = {
      safeMarkers: markers,
      updateMarker: jest.fn(),
      isMarkerDraggable: () => false,
      selectedYear: 2025,
      isAdminView: false,
      currentZoom: 16,
    };

    render(<EventSpecialMarkers {...props} />);

    // scaledGlyph = round( (30 * 10) / 60 ) = 5px (formatted to 2 decimals)
    expect(mockCreate).toHaveBeenCalled();
    const callArgs = mockCreate.mock.calls[mockCreate.mock.calls.length - 1][0];
    expect(callArgs.glyphSize).toBe('5.00px');
  });
});
