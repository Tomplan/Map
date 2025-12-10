import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import PublicDefaultYear from '../admin/PublicDefaultYear';

// Mock useOrganizationSettings hook
jest.mock('../../hooks/useOrganizationSettings', () => {
  return jest.fn(() => ({
    settings: { public_default_year: 2025 },
    loading: false,
    updateSetting: jest.fn(() => Promise.resolve(true)),
  }));
});

// Minimal dialog context mock
jest.mock('../../contexts/DialogContext', () => ({
  useDialog: () => ({ toastError: jest.fn(), toastWarning: jest.fn() }),
}));

describe('PublicDefaultYear', () => {
  it('renders and allows saving valid year', async () => {
    const { getByLabelText, getByTestId } = render(<PublicDefaultYear />);

    const input = getByLabelText(/publicDefaultYear/i);
    expect(input).toBeTruthy();

    fireEvent.change(input, { target: { value: '2026' } });

    const button = getByTestId('save-public-default-year');
    fireEvent.click(button);

    await waitFor(() => expect(document.body.textContent).toMatch(/saveSuccess/i));
  });
});
