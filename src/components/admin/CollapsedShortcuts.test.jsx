import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('../../supabaseClient', () => ({
  supabase: {
    auth: {
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
    },
  },
}));

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k) => k }) }));
jest.mock('react-router-dom', () => ({
  Link: ({ children, to, ...props }) =>
    require('react').createElement('a', { href: to, ...props }, children),
  useLocation: () => ({ pathname: '/admin/assignments' }),
}));
jest.mock('@mdi/react', () => ({
  __esModule: true,
  default: (props) => require('react').createElement('svg', null, props.children),
}));

import CollapsedShortcuts from './CollapsedShortcuts';

describe('CollapsedShortcuts', () => {
  it('renders static year and three compact links', () => {
    render(<CollapsedShortcuts selectedYear={2026} t={(k) => k} />);

    expect(screen.getByText('2026')).toBeInTheDocument();

    const sub = screen.getByRole('link', { name: /adminNav.eventSubscriptions/i });
    expect(sub).toHaveAttribute('href', '/admin/subscriptions');

    // Assignments hidden
    // const assign = screen.getByRole('link', { name: /adminNav.assignments/i });
    // expect(assign).toHaveAttribute('href', '/admin/assignments');

    const prog = screen.getByRole('link', { name: /adminNav.programManagement/i });
    expect(prog).toHaveAttribute('href', '/admin/program');

    // CollapsedShortcuts only contains the year-scoped shortcuts (subscriptions, assignments, program)
  });
});
