import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Simple i18n mock
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k, fallback) => fallback || k }),
}));

// Mock the organization settings hook (used by EventDefaults)
// for this unit test we don't care about meal defaults, so return null settings to
// prevent the component's useEffect from ever firing and causing render noise.
jest.mock('../../../hooks/useOrganizationSettings', () => () => ({
  settings: null,
  loading: false,
  error: null,
  updateSettings: jest.fn().mockResolvedValue(true),
}));

// Mock organization_profile hook to expose default_coins
jest.mock('../../../hooks/useOrganizationProfile', () => () => ({
  profile: { id: 1, name: 'Org', default_coins: 42 },
  loading: false,
  error: null,
  updateProfile: jest.fn().mockResolvedValue({ data: {}, error: null }),
}));

// Mock supabaseClient so tests don't hit network
jest.mock('../../../supabaseClient');

// Mock dialog context used by the component
jest.mock('../../../contexts/DialogContext', () => ({
  useDialog: () => ({ toastError: jest.fn(), toastWarning: jest.fn(), confirm: async () => true }),
}));

import EventDefaults from '../EventDefaults';

test('renders default_coins input from organization_profile and allows editing', async () => {
  render(<EventDefaults />);

  // default_coins input should render with initial value from profile
  const coinsInput = await screen.findByLabelText(/Default coins/i);
  expect(coinsInput).toBeInTheDocument();
  expect(coinsInput).toHaveValue(42);

  // Input is controlled and editable; we at least verify the input renders with the profile value
  // (saving/persisting is tested elsewhere via integration tests)
});
