import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock translations
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k) => k }) }));

// Mock EventMap so tests don't try to render Leaflet
jest.mock('../../EventMap/EventMap', () => (props) => (<div data-testid="event-map" data-is-admin={props.isAdminView ? 'true' : 'false'}>map</div>));

jest.mock('../../../supabaseClient');
const { __resetMocks } = require('../../../supabaseClient');
beforeEach(() => { __resetMocks(); });

jest.mock('../../../contexts/DialogContext', () => ({ useDialog: () => ({ toastError: jest.fn(), confirm: async () => true }) }));
jest.mock('../../../config/markerTabsConfig', () => ({ ICON_OPTIONS: ['default.svg'] }));
jest.mock('../../../utils/getIconPath', () => ({ getIconPath: (file) => `/assets/${file || 'default.svg'}` }));
jest.mock('../../../utils/getLogoPath', () => ({ getLogoPath: (file) => `/assets/${file || 'default.png'}` }));


// Use event_manager role for this test file
jest.doMock('../../../hooks/useUserRole', () => () => ({
  role: 'event_manager', loading: false, userInfo: {},
  hasRole: (r) => r === 'event_manager',
  hasAnyRole: (roles) => Array.isArray(roles) && roles.includes('event_manager'),
  isEventManager: true,
  isSystemManager: false,
  isSuperAdmin: false,
}));

const { default: MapManagementReloaded } = require('../MapManagement');

describe('MapManagement search & sort visibility for event_manager', () => {
  it('does not show search & sort when user is read-only (event_manager)', () => {
    render(<MapManagementReloaded markersState={[{ id: 1, lat: 52.1, lng: 4.3 }]} setMarkersState={jest.fn()} updateMarker={jest.fn()} selectedYear={2025} archiveMarkers={jest.fn()} copyMarkers={jest.fn()} />);

    const searchInput = screen.queryByPlaceholderText('mapManagement.searchPlaceholder');
    expect(searchInput).not.toBeInTheDocument();

    const sortSelect = screen.queryByLabelText('mapManagement.sortBy');
    expect(sortSelect).not.toBeInTheDocument();
  });
});
