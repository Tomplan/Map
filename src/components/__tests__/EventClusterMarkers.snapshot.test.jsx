import React from 'react';
import { render, waitFor } from '@testing-library/react';

// Reuse the same lightweight mocks as the zoom test
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
jest.mock('../../utils/markerIcons', () => ({ createMarkerIcon: () => ({ _iconObject: true }) }));
jest.mock('../../utils/getIconPath', () => ({
  getIconPath: (f) => `/assets/${f || 'default.svg'}`,
}));
jest.mock('../../utils/getDefaultLogo', () => ({
  getLogoWithFallback: () => '/assets/default-logo.png',
}));
jest.mock('../../utils/markerSizing', () => ({
  getIconSizeForZoom: () => [10, 16],
  getZoomBucket: (z) => (z < 18 ? 'A' : 'B'),
}));
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
jest.mock('../MobileBottomSheet', () => () => null);
jest.mock('../MarkerDetailsUI', () => ({ MarkerUI: () => null }));
jest.mock('../MarkerContextMenu', () => () => null);

import EventClusterMarkers from '../EventClusterMarkers';

describe('EventClusterMarkers snapshots (visual regression style)', () => {
  const baseProps = {
    safeMarkers: [{ id: 1, lat: 52.0, lng: 4.0, type: 'default', name: 'A' }],
    updateMarker: jest.fn(),
    isMarkerDraggable: () => false,
    iconCreateFunction: () => null,
  };

  it('renders a compact DOM tree for zoom=16', async () => {
    const { container } = render(<EventClusterMarkers {...baseProps} currentZoom={16} />);
    await waitFor(() => expect(container).toBeDefined());
    expect(container).toMatchSnapshot();
  });

  it('renders a slightly different DOM tree for zoom=19', async () => {
    const { container } = render(<EventClusterMarkers {...baseProps} currentZoom={19} />);
    await waitFor(() => expect(container).toBeDefined());
    expect(container).toMatchSnapshot();
  });
});
