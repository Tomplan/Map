import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k) => k }) }));
jest.mock('@mdi/react', () => ({
  Icon: (props) => require('react').createElement('svg', null, props.children),
}));

import AdminMarkerPlacement from '../AdminMarkerPlacement';

describe('AdminMarkerPlacement visibility', () => {
  it('renders add marker button when isAdminView and updateMarker present', () => {
    render(<AdminMarkerPlacement isAdminView={true} mapInstance={null} updateMarker={() => {}} />);
    const btn = screen.getByRole('button', { name: /Add marker|Add marker/i });
    expect(btn).toBeInTheDocument();
  });

  it('does not render when updateMarker is missing (read-only)', () => {
    render(<AdminMarkerPlacement isAdminView={true} mapInstance={null} updateMarker={null} />);
    const btn = screen.queryByRole('button', { name: /Add marker|Add marker/i });
    expect(btn).not.toBeInTheDocument();
  });
});
