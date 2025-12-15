import React from 'react';
import { render } from '@testing-library/react';

// Mocks for react-leaflet + cluster
jest.mock('react-leaflet', () => ({
  Marker: ({ children }) =>
    require('react').createElement('div', { 'data-testid': 'marker' }, children),
  Popup: ({ children }) =>
    require('react').createElement('div', { 'data-testid': 'popup' }, children),
}));

jest.mock('react-leaflet-markercluster', () => ({
  __esModule: true,
  default: ({ children }) =>
    require('react').createElement('div', { 'data-testid': 'cluster' }, children),
}));

// Hook & context lightweight mocks
jest.mock('../../hooks/useIsMobile', () => () => false);
jest.mock('../../contexts/OrganizationLogoContext', () => ({
  useOrganizationLogo: () => ({ organizationLogo: null, loading: false }),
}));
jest.mock('../../contexts/FavoritesContext', () => ({
  useFavoritesContext: () => ({ isFavorite: () => false }),
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

jest.mock('../../utils/markerSizing', () => ({
  getIconSizeForZoom: () => [20, 30],
  getZoomBucket: () => 'A',
}));

jest.mock('../../utils/markerIcons', () => ({
  createMarkerIcon: () => ({ _iconObject: true }),
}));

jest.mock('../../utils/getIconPath', () => ({
  getIconPath: (file) => `/assets/${file || 'default.svg'}`,
}));
jest.mock('../MobileBottomSheet', () => () => null);
jest.mock('../MarkerDetailsUI', () => ({ MarkerUI: () => null }));
jest.mock('../MarkerContextMenu', () => () => null);

import EventClusterMarkers from '../EventClusterMarkers';

describe('EventClusterMarkers — safeMarkers undefined', () => {
  it('renders without throwing when `safeMarkers` prop is omitted', () => {
    const props = {
      // Intentionally omit `safeMarkers`
      updateMarker: jest.fn(),
      isMarkerDraggable: () => false,
      iconCreateFunction: () => null,
      currentZoom: 16,
    };

    const { getByTestId } = render(<EventClusterMarkers {...props} />);

    expect(getByTestId('cluster')).toBeTruthy();
  });
});
