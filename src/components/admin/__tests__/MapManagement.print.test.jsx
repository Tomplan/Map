import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Simple translation mock
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k) => k }) }));

// Mock supabase client
jest.mock('../../../supabaseClient');
const { __resetMocks } = require('../../../supabaseClient');

beforeEach(() => { __resetMocks(); });

// Mock user role to be event_manager (read-only) — this role should see the header print
jest.mock('../../../hooks/useUserRole', () => () => ({
  role: 'event_manager',
  loading: false,
  userInfo: {},
  hasRole: (r) => r === 'event_manager',
  hasAnyRole: (roles) => Array.isArray(roles) && roles.includes('event_manager'),
}));

jest.mock('../../../contexts/DialogContext', () => ({ useDialog: () => ({ toastError: jest.fn(), confirm: async () => true }) }));

// Minimal mocks for other imports used by MapManagement
jest.mock('../../../config/markerTabsConfig', () => ({ ICON_OPTIONS: ['default.svg'] }));
jest.mock('../../../utils/getIconPath', () => ({ getIconPath: (file) => `/assets/${file || 'default.svg'}` }));
jest.mock('../../../utils/getLogoPath', () => ({ getLogoPath: (file) => `/assets/${file || 'default.png'}` }));

// Mock EventMap so it calls onMapReady with a fake map on mount
jest.mock('../../EventMap/EventMap', () => {
  // require React inside the factory so Jest's static mock validation allows it
  const React = require('react');
  return (props) => {
    React.useEffect(() => {
      if (props.onMapReady) {
        props.onMapReady({
          printControl: { options: { printModes: [ { options: { title: 'A4 — Landscape' } } ] } }
        });
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return React.createElement('div', { 'data-testid': 'event-map-mock' }, 'mock');
  };
});

import MapManagement from '../MapManagement';

test('header Print Map shows plugin preset when EventMap calls onMapReady', async () => {
  render(
    <MapManagement markersState={[]} setMarkersState={jest.fn()} updateMarker={jest.fn()} selectedYear={2025} archiveMarkers={jest.fn()} copyMarkers={jest.fn()} />
  );

  // Print Map button should exist
  const printBtn = await screen.findByTitle('Print map');
  expect(printBtn).toBeInTheDocument();

  // Open the dropdown
  fireEvent.click(printBtn);

  // Expect the mode provided by the mock onMapReady to be visible
  const preset = await screen.findByText('A4 — Landscape');
  expect(preset).toBeInTheDocument();
});
