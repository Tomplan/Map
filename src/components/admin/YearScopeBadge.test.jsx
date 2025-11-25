import React from 'react';
import { render, screen } from '@testing-library/react';
// Mock i18n hook used by component
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k) => {
    const map = {
      'admin.yearScope.global': 'Global (all years)',
      'admin.yearScope.eventSpecific': 'Event-specific (changes with year)'
    };
    return map[k] || k;
  } })
}));
import '@testing-library/jest-dom';
import YearScopeBadge from './YearScopeBadge';

describe('YearScopeBadge', () => {
  it('renders global label when scope=global', () => {
    render(<YearScopeBadge scope="global" />);
    expect(screen.getByText(/Global \(all years\)/i)).toBeInTheDocument();
  });

  it('renders event-specific label when scope != global', () => {
    render(<YearScopeBadge scope="year" />);
    expect(screen.getByText(/Event-specific \(changes with year\)/i)).toBeInTheDocument();
  });
});
