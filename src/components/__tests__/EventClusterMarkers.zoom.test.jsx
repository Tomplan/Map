import React from 'react';
import { render, waitFor } from '@testing-library/react';

// lightweight mocks for react-leaflet + cluster so we can mount the component
jest.mock('react-leaflet', () => ({
  Marker: ({ children }) => require('react').createElement('div', { 'data-testid': 'marker' }, children),
  Popup: ({ children }) => require('react').createElement('div', { 'data-testid': 'popup' }, children),
}));

  jest.mock('react-leaflet-markercluster', () => ({
    __esModule: true,
    default: ({ children }) => require('react').createElement('div', { 'data-testid': 'cluster' }, children),
  }));

// Hook & context lightweight mocks used within EventClusterMarkers
jest.mock('../../hooks/useIsMobile', () => () => false);
jest.mock('../../contexts/OrganizationLogoContext', () => ({ useOrganizationLogo: () => ({ organizationLogo: null, loading: false }) }));
jest.mock('../../contexts/FavoritesContext', () => ({ useFavoritesContext: () => ({ isFavorite: () => false }) }));
jest.mock('../../hooks/useEventSubscriptions', () => () => ({ subscriptions: [] }));
jest.mock('../../hooks/useAssignments', () => () => ({ assignments: [], assignCompanyToMarker: async () => {}, unassignCompanyFromMarker: async () => {} }));
jest.mock('../../contexts/DialogContext', () => ({ useDialog: () => ({ confirm: async () => true }) }));

// Spy on the icon factory to assert icon creation is called when zoom bucket changes
const mockCreate = jest.fn(() => ({ _iconObject: true }));
jest.mock('../../utils/markerIcons', () => ({ createMarkerIcon: (...args) => mockCreate(...args) }));
// Avoid modules that use `import.meta` in tests by replacing getBaseUrl/getIconPath
jest.mock('../../utils/getIconPath', () => ({ getIconPath: (file) => `/assets/${file || 'default.svg'}` }));
jest.mock('../../utils/getDefaultLogo', () => ({ getLogoWithFallback: (logo, org) => logo || org || '/assets/default-logo.png' }));
// Avoid importing mobile-only UI slices that bring in other app modules which
// rely on import.meta (supabase config, env vars). Provide a stub BottomSheet.
jest.mock('../MobileBottomSheet', () => () => null);
jest.mock('../MarkerDetailsUI', () => ({ MarkerUI: () => null }));
jest.mock('../MarkerContextMenu', () => () => null);

// Avoid importing the real markerSizing (which pulls config using import.meta)
jest.mock('../../utils/markerSizing', () => ({
  getIconSizeForZoom: (zoom, baseSize) => {
    // simple proportional scaling: if zoom < 18 shrink by 50%, else use base
    const scale = zoom < 18 ? 0.5 : 1.0;
    return [Math.round(baseSize?.[0] ? baseSize[0] * scale : 8), Math.round(baseSize?.[1] ? baseSize[1] * scale : 13)];
  },
  getZoomBucket: (zoom) => (zoom < 18 ? 'A' : 'B'),
}));

import EventClusterMarkers from '../EventClusterMarkers';

describe('EventClusterMarkers -- zoom bucket behavior', () => {
  it('recreates marker icons when zoom bucket changes (calls createMarkerIcon again)', async () => {
    // two markers to ensure multiple invocations
    const markers = [
      { id: 1, lat: 52.0, lng: 4.0, type: 'default' },
      { id: 2, lat: 52.0005, lng: 4.0005, type: 'default' },
    ];

    const props = {
      safeMarkers: markers,
      updateMarker: jest.fn(),
      isMarkerDraggable: () => false,
      iconCreateFunction: () => null,
      currentZoom: 16, // bucket A
    };

    const { rerender } = render(<EventClusterMarkers {...props} />);

    // createMarkerIcon should have been called once per marker on initial render
    await waitFor(() => expect(mockCreate).toHaveBeenCalledTimes(2));

    // Change to a higher zoom that falls into a different zoom bucket (trigger re-creation)
    mockCreate.mockClear();
    rerender(<EventClusterMarkers {...props} currentZoom={18} />);

    // Both markers should have new icons created again
    await waitFor(() => expect(mockCreate).toHaveBeenCalledTimes(2));
  });
});
