import React from 'react';
import { render, screen } from '@testing-library/react';
import '../../i18n';

jest.mock('../../contexts/PreferencesContext', () => ({
  usePreferences: () => ({ preferences: null, updatePreference: jest.fn() }),
}));

jest.mock('../../contexts/DialogContext', () => ({
  useDialog: () => ({ toastError: jest.fn(), toastWarning: jest.fn() }),
}));

import LanguageToggle from '../LanguageToggle';

test('hides German option when excludeCodes includes de', () => {
  render(<LanguageToggle excludeCodes={["de"]} />);

  // English and Nederlands should be present
  expect(screen.getByText('English')).toBeInTheDocument();
  expect(screen.getByText('Nederlands')).toBeInTheDocument();

  // Deutsch should NOT be present
  expect(screen.queryByText('Deutsch')).toBeNull();
});
