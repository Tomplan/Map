import React from 'react';
import { render } from '@testing-library/react';

// Mocks for react-leaflet
jest.mock('react-leaflet', () => ({
  Marker: ({ children }) => require('react').createElement('div', { 'data-testid': 'marker' }, children),
  Popup: ({ children }) => require('react').createElement('div', { 'data-testid': 'popup' }, children),
}));

// Hook & context lightweight mocks
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

jest.mock('../../utils/markerSizing', () => ({
  getIconSizeForZoom: () => [20, 30],
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

import EventSpecialMarkers from '../EventSpecialMarkers';

describe('EventSpecialMarkers — safeMarkers null', () => {
  it('renders without throwing when `safeMarkers` prop is null', () => {
    const props = {
      safeMarkers: null,
      updateMarker: jest.fn(),
      isMarkerDraggable: () => false,
      currentZoom: 16,
    };

    const { getByTestId } = render(<EventSpecialMarkers {...props} />);

    expect(getByTestId('marker')).toBeTruthy();
  });
});
