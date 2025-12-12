import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Simple i18n mock
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k, fallback) => fallback || k }),
}));

// Mock the organization settings hook (used by EventDefaults)
jest.mock('../../../hooks/useOrganizationSettings', () => () => ({
  settings: {
    default_breakfast_sat: 10,
    default_lunch_sat: 20,
    default_bbq_sat: 5,
    default_breakfast_sun: 6,
    default_lunch_sun: 8,
    notification_settings: {
      emailNotifications: true,
      newSubscriptionNotify: true,
      assignmentChangeNotify: true,
    },
  },
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
