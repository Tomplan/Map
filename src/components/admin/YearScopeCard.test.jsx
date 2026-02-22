import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock i18n
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (k) => {
      const map = {
        'admin.yearScope.title': 'Year-scoped data',
        'admin.yearScope.eventSpecific': 'Event-specific (changes with year)',
        'admin.yearScope.viewingYear': 'Viewing year',
        'admin.yearScope.subscriptions': 'Subscriptions',
        'admin.yearScope.assignments': 'Assignments',
        'admin.yearScope.program': 'Program',
        'admin.yearScope.preview': 'Preview changes',
      };
      return map[k] || k;
    },
  }),
}));

import '@testing-library/jest-dom';
import YearScopeCard from './YearScopeCard';

describe('YearScopeCard', () => {
  // Make tests deterministic by fixing the system time so `new Date().getFullYear()` is stable for each test
  beforeEach(() => {
    jest.useFakeTimers('modern');
    jest.setSystemTime(new Date('2025-06-01'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });
  it('renders with counts and selector', () => {
    const { asFragment } = render(
      <YearScopeCard
        selectedYear={2025}
        setSelectedYear={jest.fn()}
        counts={{ subscriptions: 42, assignments: 12, program: 3 }}
        onPreview={jest.fn()}
      />,
    );

    // Basic assertions - ensure the key labels render and ARIA features exist
    expect(screen.getByText(/Year-scoped data/i)).toBeInTheDocument();
    expect(screen.getByText(/Subscriptions/i)).toBeInTheDocument();
    expect(screen.getByText(/Assignments/i)).toBeInTheDocument();

    // Accessibility assertions
    const select = screen.getByLabelText(/Viewing year/i);
    expect(select).toHaveAttribute('id', 'year-scope-select');

    // Tile links have aria-label with counts
    expect(screen.getByRole('link', { name: /Subscriptions 42/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Assignments 12/i })).toBeInTheDocument();

    // Preview button connects to a preview area
    const previewBtn = screen.getByRole('button', { name: /Preview changes/i });
    expect(previewBtn).toHaveAttribute('aria-controls', 'year-change-preview');

    // Snapshot of the rendered card (small demo)
    expect(asFragment()).toMatchSnapshot();
  });
});
