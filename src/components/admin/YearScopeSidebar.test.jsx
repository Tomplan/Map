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

// Mock supabase to provide counts
jest.mock('../../supabaseClient', () => ({
  supabase: {
    from: (table) => ({
      select: () => ({ eq: () => Promise.resolve({ count: table === 'assignments' ? 99 : (table === 'event_subscriptions' ? 63 : 0) }) }),
    }),
  },
}));

import YearScopeSidebar from './YearScopeSidebar';

describe('YearScopeSidebar (icon + labels)', () => {
  it('renders nav-like items with correct labels and icons', async () => {
    const onYearChange = jest.fn();
    render(<YearScopeSidebar selectedYear={2025} onYearChange={onYearChange} />);

    // items should render with nav text
    expect(await screen.findByText(/Inschrijvingen/)).toBeInTheDocument();
    expect(screen.getByText(/Toewijzingen/)).toBeInTheDocument();
    expect(screen.getByText(/Programmabeheer/)).toBeInTheDocument();

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
