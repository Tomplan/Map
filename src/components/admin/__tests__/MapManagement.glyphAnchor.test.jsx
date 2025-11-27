import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k) => k }) }));

// Mock EventMap to avoid map rendering
jest.mock('../../EventMap/EventMap', () => () => (<div data-testid="event-map">map</div>));

// Mock supabase for fetching defaults
jest.mock('../../../supabaseClient', () => ({
  supabase: {
    from: (table) => ({
      select: () => ({ in: () => Promise.resolve({ data: [] }) }),
    }),
  },
}));

// Mock hooks that rely on auth/session
jest.mock('../../../hooks/useUserRole', () => () => ({
  role: 'system_manager',
  loading: false,
  userInfo: {},
  hasRole: (r) => r === 'system_manager',
  hasAnyRole: (roles) => Array.isArray(roles) && roles.includes('system_manager'),
}));

jest.mock('../../../contexts/DialogContext', () => ({ useDialog: () => ({ toastError: jest.fn(), confirm: async () => true }) }));

// Mock markerTabsConfig to avoid import.meta based paths
jest.mock('../../../config/markerTabsConfig', () => ({ ICON_OPTIONS: ['default.svg'] }));

// Mock helpers that read import.meta
jest.mock('../../../utils/getIconPath', () => ({ getIconPath: (file) => `/assets/${file || 'default.svg'}` }));
jest.mock('../../../utils/getLogoPath', () => ({ getLogoPath: (file) => `/assets/${file || 'default.png'}` }));

import MapManagement from '../MapManagement';

describe('MapManagement glyphAnchor edit UI', () => {
  it('shows glyph anchor X/Y inputs when editing a marker', async () => {
    const markers = [
      { id: 5, lat: 52.0, lng: 4.0, glyph: 'A', iconSize: [20, 40], glyphSize: 12, glyphAnchor: [1, -2] },
    ];

    const updateMarker = jest.fn();
    const setMarkersState = jest.fn();

    render(<MapManagement markersState={markers} setMarkersState={setMarkersState} updateMarker={updateMarker} selectedYear={2025} />);

    // Select the marker list item (uses glyph if present)
    const button = await screen.findByRole('button', { name: /A|Marker 5/i });
    fireEvent.click(button);

    // Click the Edit button
    const editBtn = screen.getByText('Edit');
    fireEvent.click(editBtn);

    // Inputs for Glyph Anchor X and Y should be present
    await waitFor(() => {
      expect(screen.getByLabelText('Glyph Anchor X')).toBeInTheDocument();
      expect(screen.getByLabelText('Glyph Anchor Y')).toBeInTheDocument();
    });
  });
});
