import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock translations
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k) => k }) }));

// Mock EventMap
jest.mock('../../EventMap/EventMap', () => (props) => (
  <div data-testid="event-map" data-is-admin={props.isAdminView ? 'true' : 'false'}>
    map
  </div>
));

jest.mock('../../../supabaseClient');
const { __resetMocks } = require('../../../supabaseClient');
beforeEach(() => {
  __resetMocks();
});

jest.mock('../../../contexts/DialogContext', () => ({
  useDialog: () => ({ toastError: jest.fn(), confirm: async () => true }),
}));
jest.mock('../../../config/markerTabsConfig', () => ({ ICON_OPTIONS: ['default.svg'] }));
jest.mock('../../../utils/getIconPath', () => ({
  getIconPath: (file) => `/assets/${file || 'default.svg'}`,
}));
jest.mock('../../../utils/getLogoPath', () => ({
  getLogoPath: (file) => `/assets/${file || 'default.png'}`,
}));

// system_manager (editable)
jest.doMock('../../../hooks/useUserRole', () => () => ({
  role: 'system_manager',
  loading: false,
  userInfo: {},
  hasRole: (r) => r === 'system_manager',
  hasAnyRole: (roles) => Array.isArray(roles) && roles.includes('system_manager'),
  isEventManager: false,
  isSystemManager: true,
  isSuperAdmin: false,
}));

const { default: MapManagementReloaded } = require('../MapManagement');

describe('MapManagement panels for system_manager', () => {
  it('shows left marker list and right details for editable user', () => {
    render(
      <MapManagementReloaded
        markersState={[{ id: 7, lat: 52.1, lng: 4.3 }]}
        setMarkersState={jest.fn()}
        updateMarker={jest.fn()}
        selectedYear={2025}
        archiveMarkers={jest.fn()}
        copyMarkers={jest.fn()}
      />,
    );

    expect(screen.getByText(/ID:\s*7/i)).toBeInTheDocument();
    expect(screen.getByText('mapManagement.selectMarker')).toBeInTheDocument();
  });
});
