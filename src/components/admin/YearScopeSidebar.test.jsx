import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock translations used by the sidebar
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k) => {
    const map = {
      'admin.yearScope.title': 'Year-scoped data',
      'admin.yearScope.viewingYear': 'Viewing year',
      'admin.yearScope.subscriptions': 'Subscriptions',
      'admin.yearScope.assignments': 'Assignments',
      'admin.yearScope.program': 'Program',
    };
    return map[k] || k;
  } })
}));

// Mock supabase to provide counts
jest.mock('../../supabaseClient', () => ({
  supabase: {
    from: (table) => ({
      select: () => ({ eq: () => Promise.resolve({ count: table === 'assignments' ? 12 : (table === 'event_subscriptions' ? 63 : 0) }) }),
    }),
  },
}));

import YearScopeSidebar from './YearScopeSidebar';

describe('YearScopeSidebar', () => {
  it('renders counts and handles year selection', async () => {
    const onYearChange = jest.fn();
    const { findByText } = render(<YearScopeSidebar selectedYear={2025} onYearChange={onYearChange} />);

    // ensure labels render
    expect(await findByText(/Year-scoped data/)).toBeInTheDocument();
    expect(screen.getByText(/Subscriptions/)).toBeInTheDocument();

    // select a different year and assert callback
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '2024' } });
    expect(onYearChange).toHaveBeenCalledWith(2024);
  });
});
