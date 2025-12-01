import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock translations used by the sidebar
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k) => {
    const map = {
      'admin.yearScope.title': 'Evenement-specifieke gegevens',
      'admin.yearScope.viewingYear': 'Geselecteerd jaar',
      'adminNav.eventSubscriptions': 'Inschrijvingen',
      'adminNav.assignments': 'Toewijzingen',
      'adminNav.programManagement': 'Programmabeheer',
    };
    return map[k] || k;
  } })
}));

// Use centralized supabaseClient mock and configure responses for each test
jest.mock('../../supabaseClient');
const { __setQueryResponse, __resetMocks } = require('../../supabaseClient');

beforeEach(() => {
  __resetMocks();
  // make subscription and assignment counts available to the hooks (configure eq -> single)
  __setQueryResponse('subscription_counts', 'eq', { count: 63 });
  __setQueryResponse('assignment_counts', 'eq', { count: 99 });
});

// Mock react-router-dom the same way other admin tests do so we avoid pulling
// in router implementation (TextEncoder issues in jest env) and keep Link simple
jest.mock('react-router-dom', () => {
  const React = require('react');
  return {
    Link: ({ children, to, ...props }) => React.createElement('a', { href: to, ...props }, children),
    // many components in admin tests assume a simple useLocation shape — provide a lightweight mock
    useLocation: () => ({ pathname: '/admin/subscriptions' }),
  };
});

// TextEncoder/Decoder polyfill for Node test env
if (typeof TextEncoder === 'undefined') {
  // eslint-disable-next-line global-require
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

import YearScopeSidebar from './YearScopeSidebar';

describe('YearScopeSidebar (icon + labels)', () => {
  it('renders nav-like items with correct labels and icons', async () => {
    const onYearChange = jest.fn();
    render(<YearScopeSidebar selectedYear={2025} onYearChange={onYearChange} />);

    // items should render with nav text and counts
    expect(await screen.findByText(/Inschrijvingen/)).toBeInTheDocument();
    expect(screen.getByText(/Toewijzingen/)).toBeInTheDocument();
    expect(screen.getByText(/Programmabeheer/)).toBeInTheDocument();

    // counts from mocked supabase should be visible
    expect(await screen.findByText('63')).toBeInTheDocument();
    expect(screen.getByText('99')).toBeInTheDocument();

    // each tile should use the same rounded/nav styling as the main nav (px-4, rounded-lg)
    const links = screen.getAllByRole('link');
    const sub = links.find((el) => el.getAttribute('href') === '/admin/subscriptions');
    expect(sub).toHaveClass('rounded-lg');
    // SidebarTile styling for compact mode uses smaller horizontal padding
    expect(sub).toHaveClass('px-2');

    // there should be links with the expected href
    const subLink = screen.getByRole('link', { name: /Inschrijvingen/i });
    expect(subLink).toHaveAttribute('href', '/admin/subscriptions');

    // year select should call onYearChange
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '2024' } });
    expect(onYearChange).toHaveBeenCalledWith(2024);
  });
});
// (Tests for YearScopeSidebar - single combined test file)
