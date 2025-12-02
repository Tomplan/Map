import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock translations used by the component
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k) => k }) }));

// Mock EventMap to expose props on the DOM
jest.mock('../../EventMap/EventMap', () => (props) => (
  <div data-testid="event-map" data-is-admin={props.isAdminView ? 'true' : 'false'}>
    {props.isAdminView ? 'admin' : 'visitor'}
  </div>
));

// Mock supabase client
jest.mock('../../../supabaseClient');
const { __setQueryResponse, __resetMocks } = require('../../../supabaseClient');

beforeEach(() => { __resetMocks(); });

// Mock hooks that rely on auth/session — event_manager role (read-only)
jest.mock('../../../hooks/useUserRole', () => () => ({
  role: 'event_manager',
  loading: false,
  userInfo: {},
  hasRole: (r) => r === 'event_manager',
  hasAnyRole: (roles) => Array.isArray(roles) && roles.includes('event_manager'),
}));

jest.mock('../../../contexts/DialogContext', () => ({ useDialog: () => ({ toastError: jest.fn(), confirm: async () => true }) }));

// Minimal config mocks
jest.mock('../../../config/markerTabsConfig', () => ({ ICON_OPTIONS: ['default.svg'] }));
jest.mock('../../../utils/getIconPath', () => ({ getIconPath: (file) => `/assets/${file || 'default.svg'}` }));
jest.mock('../../../utils/getLogoPath', () => ({ getLogoPath: (file) => `/assets/${file || 'default.png'}` }));

import MapManagement from '../MapManagement';

test('Event managers still get admin EventMap (isAdminView=true) inside MapManagement', async () => {
  const markers = [ { id: 1, lat: 52.1, lng: 4.3 } ];

  render(<MapManagement markersState={markers} setMarkersState={jest.fn()} updateMarker={jest.fn()} selectedYear={2025} archiveMarkers={jest.fn()} copyMarkers={jest.fn()} />);

  const mapNode = await screen.findByTestId('event-map');
  expect(mapNode).toBeInTheDocument();
  expect(mapNode).toHaveAttribute('data-is-admin', 'true');
});
