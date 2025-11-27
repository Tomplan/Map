import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Minimal mocks to render the AdminLayout component in isolation
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k) => k }),
}));

// Mock Icon to avoid rendering svg complexity
jest.mock('@mdi/react', () => ({
  __esModule: true,
  default: (props) => require('react').createElement('svg', null, props.children),
}));

// Mock react-router-dom components used by AdminLayout
jest.mock('react-router-dom', () => ({
  Link: ({ children, to, ...props }) => require('react').createElement('a', { href: to, ...props }, children),
  Outlet: () => null,
  useLocation: () => ({ pathname: '/admin' }),
}));

// Mock useUserRole hook to make nav items visible
jest.mock('../hooks/useUserRole', () => () => ({ role: 'event_manager', loading: false, hasAnyRole: () => true }));

// Ensure collapsed state is simulated by setting localStorage
beforeEach(() => {
  localStorage.setItem('adminSidebarCollapsed', 'true');
});

afterEach(() => {
  localStorage.removeItem('adminSidebarCollapsed');
});

describe('AdminLayout (collapsed sidebar code presence)', () => {
  it('contains collapsed icon links for the year-scoped pages in source', () => {
    const fs = require('fs');
    const path = require('path');
    const file = fs.readFileSync(path.resolve(__dirname, './admin/CollapsedShortcuts.jsx'), 'utf8');

    // verify collapsed shortcuts file contains the compact links and expected classes
      // CollapsedShortcuts includes the year-scoped shortcuts (subscriptions, assignments, program)
      expect(file).toMatch(/to=\"\/admin\/subscriptions\"/);
      expect(file).toMatch(/to=\"\/admin\/assignments\"/);
      expect(file).toMatch(/to=\"\/admin\/program\"/);
    // collapsed component should use vertical padding at the container level (px handled inside tiles)
    expect(file).toMatch(/py-3/);
    // compact mode triggers `isCollapsed={true}` on the tiles (icons size controlled in SidebarTile)
    expect(file).toMatch(/isCollapsed=\{true\}/);

    // Icon size is set inside the SidebarTile implementation; ensure that file contains the icon size override
    const sideFile = fs.readFileSync(path.resolve(__dirname, './admin/SidebarTile.jsx'), 'utf8');
    expect(sideFile).toMatch(/size=\{1\}/);
  });
});
