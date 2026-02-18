import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '../../i18n';

jest.mock('../../contexts/PreferencesContext', () => ({
  usePreferences: () => ({ preferences: null, updatePreference: jest.fn() }),
}));

jest.mock('../../contexts/DialogContext', () => ({
  useDialog: () => ({ toastError: jest.fn(), toastWarning: jest.fn() }),
}));

import LanguageToggle from '../LanguageToggle';
import i18n from '../../i18n';

test('single click on language button updates i18n.language and button active state', async () => {
  // ensure starting language is en
  await i18n.changeLanguage('en');

  render(<LanguageToggle />);

  const nlButton = screen.getByText('Nederlands');
  expect(nlButton).toBeInTheDocument();

  // Initially not active
  expect(nlButton).toHaveAttribute('aria-pressed', 'false');

  // Click once
  fireEvent.click(nlButton);

  // i18n should update immediately
  expect(i18n.language).toBe('nl');

  // Button should reflect active state
  expect(nlButton).toHaveAttribute('aria-pressed', 'true');
});