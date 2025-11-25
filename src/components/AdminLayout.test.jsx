import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import YearChangeModal from './admin/YearChangeModal';

// Mock i18n for predictable strings
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k, opts) => {
    if (k === 'admin.yearSwitcher.modalTitle') return `Switch to ${opts.year}?`;
    if (k === 'admin.yearSwitcher.switchButton') return `Switch to ${opts.year}`;
    if (k === 'admin.yearSwitcher.modalIntro') return `Are you sure you want to switch to ${opts.year}?`;
    if (k.startsWith('admin.yearSwitcher.willChange')) return {
      'admin.yearSwitcher.willChange.subscriptions': 'Subscriptions',
      'admin.yearSwitcher.willChange.assignments': 'Assignments',
      'admin.yearSwitcher.willChange.program': 'Program Management'
    }[k] || k;
    if (k.startsWith('admin.yearSwitcher.wontChange')) return {
      'admin.yearSwitcher.wontChange.companies': 'Companies'
    }[k] || k;
    return k;
  } })
 ,
  Trans: ({ i18nKey, values }) => {
    // Simple test stub for Trans: return plain text with interpolated year
    if (i18nKey === 'admin.yearSwitcher.modalIntro') return `Are you sure you want to switch to ${values?.year || ''}?`;
    return i18nKey;
  }
}));

describe('Admin year selector flow (isolated)', () => {
  it('opens the modal and confirms the year change', () => {
    // A minimal component that behaves like the AdminLayout year selector logic
    function YearSelectorTest({ selectedYear, onChangeConfirmed }) {
      const [pending, setPending] = React.useState(null);
      const [showModal, setShowModal] = React.useState(false);

      return (
        <div>
          <select
            value={selectedYear}
            onChange={(e) => {
              const newY = parseInt(e.target.value, 10);
              if (newY === selectedYear) return;
              setPending(newY);
              setShowModal(true);
            }}
            aria-label="Event Year"
          >
            <option value={2023}>2023</option>
            <option value={2024}>2024</option>
          </select>

          <YearChangeModal
            isOpen={showModal}
            newYear={pending}
            onClose={() => { setPending(null); setShowModal(false); }}
            onConfirm={() => { onChangeConfirmed(pending); setPending(null); setShowModal(false); }}
          />
        </div>
      );
    }

    const setSelectedYear = jest.fn();

    render(<YearSelectorTest selectedYear={2024} onChangeConfirmed={setSelectedYear} />);

    const select = screen.getByLabelText(/Event Year/i);
    fireEvent.change(select, { target: { value: '2023' } });

    // modal title should be present (heading)
    expect(screen.getByRole('heading', { name: /Switch to 2023\?/i })).toBeInTheDocument();

    const confirm = screen.getByRole('button', { name: /Switch to 2023/i });
    fireEvent.click(confirm);

    expect(setSelectedYear).toHaveBeenCalledWith(2023);
  });
});
