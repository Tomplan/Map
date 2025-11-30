import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock i18n
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k, opts) => {
    const map = {
      'admin.yearScope.title': 'Year-scoped data',
      'admin.yearScope.viewingYear': 'Viewing year',
      'admin.yearScope.subscriptions': 'Subscriptions',
      'admin.yearScope.assignments': 'Assignments',
      'admin.yearScope.program': 'Program',
      'admin.yearScope.preview': 'Preview changes',
      'admin.yearSwitcher.modalTitle': `Switch to ${opts?.year || 'year'}?`,
      'admin.yearSwitcher.modalIntro': `Changing to ${opts?.year || 'year'} will affect subscriptions`,
      'admin.yearSwitcher.willChange.subscriptions': 'Subscriptions',
      'admin.yearSwitcher.willChange.assignments': 'Assignments',
      'admin.yearSwitcher.willChange.program': 'Program',
      'admin.yearSwitcher.wontChange.companies': 'Companies',
      'admin.yearSwitcher.wontChange.companiesDesc': 'Companies are global',
      'common.cancel': 'Cancel',
      'admin.yearSwitcher.switchButton': 'Switch',
      'dashboard.subscriptions': 'Subscriptions'
    };
    return map[k] || k;
  } }),
  Trans: ({ children }) => children,
}));

// Mock the subscriptions hook
jest.mock('../../hooks/useEventSubscriptions', () => {
  return jest.fn((selectedYear) => ({
    subscriptions: [],
    loading: false,
  }));
});

// Mock supabase client so fetchCounts doesn't throw
jest.mock('../../supabaseClient', () => ({
  supabase: {
    from: (table) => ({
      select: () => ({
        gt: () => Promise.resolve({ count: table.includes('markers_core') ? 10 : 0 }),
        eq: () => Promise.resolve({ count: table === 'assignments' ? 12 : 0 }),
      }),
    }),
  },
}));

// Mock react-router-dom to avoid pulling in router implementation (TextEncoder issues in jest env)
jest.mock('react-router-dom', () => {
  const React = require('react');
  return {
    Link: ({ children, to }) => React.createElement('a', { href: to }, children),
    Outlet: () => null,
    useLocation: () => ({ pathname: '/admin' }),
  };
});

// Node (Jest) doesn't always provide TextEncoder/Decoder used by some deps
if (typeof TextEncoder === 'undefined') {
  // eslint-disable-next-line global-require
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

import Dashboard from './Dashboard';

describe('Dashboard integration', () => {
  it('no longer renders the inline YearScopeCard in Dashboard (moved to sidebar)', async () => {
    const setSelectedYear = jest.fn();

    render(<Dashboard selectedYear={2025} setSelectedYear={setSelectedYear} />);

    // The Dashboard should not have the year selector (moved into AdminLayout sidebar)
    const select = screen.queryByLabelText(/Viewing year/i);
    expect(select).toBeNull();
  });
});
