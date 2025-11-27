import React from 'react';
import { render } from '@testing-library/react';

// Mocks for react-leaflet + cluster
jest.mock('react-leaflet', () => ({
  Marker: ({ children }) => require('react').createElement('div', { 'data-testid': 'marker' }, children),
  Popup: ({ children }) => require('react').createElement('div', { 'data-testid': 'popup' }, children),
}));

jest.mock('react-leaflet-markercluster', () => ({
  __esModule: true,
  default: ({ children }) => require('react').createElement('div', { 'data-testid': 'cluster' }, children),
}));

// Hook & context lightweight mocks
jest.mock('../../hooks/useIsMobile', () => () => false);
jest.mock('../../contexts/OrganizationLogoContext', () => ({ useOrganizationLogo: () => ({ organizationLogo: null, loading: false }) }));
jest.mock('../../contexts/FavoritesContext', () => ({ useFavoritesContext: () => ({ isFavorite: () => false }) }));
jest.mock('../../hooks/useEventSubscriptions', () => () => ({ subscriptions: [] }));
jest.mock('../../hooks/useAssignments', () => () => ({ assignments: [], assignCompanyToMarker: async () => {}, unassignCompanyFromMarker: async () => {} }));
jest.mock('../../contexts/DialogContext', () => ({ useDialog: () => ({ confirm: async () => true }) }));

// Spy on getIconSizeForZoom to ensure baseSize param is marker.iconSize
const mockGetIconSizeForZoom = jest.fn(() => [20, 30]);
jest.mock('../../utils/markerSizing', () => ({
  getIconSizeForZoom: (...args) => mockGetIconSizeForZoom(...args),
  getZoomBucket: (zoom) => 'A',
}));

// Spy on createMarkerIcon
const mockCreate = jest.fn(() => ({ _iconObject: true }));
jest.mock('../../utils/markerIcons', () => ({ createMarkerIcon: (...args) => mockCreate(...args) }));

// Avoid modules that use `import.meta`
jest.mock('../../utils/getIconPath', () => ({ getIconPath: (file) => `/assets/${file || 'default.svg'}` }));
jest.mock('../../utils/getDefaultLogo', () => ({ getLogoWithFallback: (logo, org) => logo || org || '/assets/default-logo.png' }));
jest.mock('../MobileBottomSheet', () => () => null);
jest.mock('../MarkerDetailsUI', () => ({ MarkerUI: () => null }));
jest.mock('../MarkerContextMenu', () => () => null);

import EventClusterMarkers from '../EventClusterMarkers';

describe('EventClusterMarkers — base size source', () => {
  it('uses marker.iconSize as the base size, ignoring iconBaseSize', () => {
    const markers = [
      { id: 1, lat: 52.0, lng: 4.0, type: 'default', iconSize: [40, 80], iconBaseSize: [10, 20] },
    ];

    const props = {
      safeMarkers: markers,
      updateMarker: jest.fn(),
      isMarkerDraggable: () => false,
      iconCreateFunction: () => null,
      currentZoom: 16,
    };

    render(<EventClusterMarkers {...props} />);

    // getIconSizeForZoom should have been called and the base size passed should be marker.iconSize
    expect(mockGetIconSizeForZoom).toHaveBeenCalled();
    const calledArgs = mockGetIconSizeForZoom.mock.calls[0];
    // second arg is the baseSize
    expect(Array.isArray(calledArgs[1])).toBe(true);
    expect(calledArgs[1]).toEqual([40, 80]);
  });

  it('computes missing icon height from width for iconSize with only width', () => {
    const markers = [
      { id: 2, lat: 52.0, lng: 4.0, type: 'default', iconSize: [40] },
    ];

    const props = {
      safeMarkers: markers,
      updateMarker: jest.fn(),
      isMarkerDraggable: () => false,
      iconCreateFunction: () => null,
      currentZoom: 16,
    };

    render(<EventClusterMarkers {...props} />);

    expect(mockGetIconSizeForZoom).toHaveBeenCalled();
    const calledArgs = mockGetIconSizeForZoom.mock.calls[mockGetIconSizeForZoom.mock.calls.length - 1];
    // DEFAULT_ICON.SIZE in component is [15,25], so height should be computed as round(40 * 25/15) = 67
    expect(calledArgs[1]).toEqual([40, 67]);
  });

  it('scales explicitly configured glyphSize relative to stored iconSize', () => {
    // Force getIconSizeForZoom to return a scaled icon height (20x40)
    mockGetIconSizeForZoom.mockReturnValueOnce([20, 40]);

    const markers = [
      { id: 3, lat: 52.0, lng: 4.0, type: 'default', iconSize: [40, 80], glyphSize: '12px' },
    ];

    const props = {
      safeMarkers: markers,
      updateMarker: jest.fn(),
      isMarkerDraggable: () => false,
      iconCreateFunction: () => null,
      currentZoom: 16,
    };

    render(<EventClusterMarkers {...props} />);

    // scaledGlyph = round((currentIconHeight * baseGlyphPx) / baseIconHeight)
    // currentIconHeight = 40, baseIconHeight = 80, baseGlyphPx = 12 => scaled = 6
    expect(mockCreate).toHaveBeenCalled();
    const callArgs = mockCreate.mock.calls[mockCreate.mock.calls.length - 1][0];
    expect(callArgs.glyphSize).toBe('6.00px');
  });
});
