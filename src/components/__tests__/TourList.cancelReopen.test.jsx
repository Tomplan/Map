import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k) => k, i18n: { language: 'en' } }),
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useLocation: () => ({ pathname: '/admin', hash: '#/admin' }),
  useNavigate: () => mockNavigate,
}));

const mockContextStartTour = jest.fn();
jest.mock('../../contexts/OnboardingContext', () => ({
  useOnboarding: () => ({
    isTourCompleted: () => false,
    startTour: mockContextStartTour,
  }),
}));

jest.mock('../../hooks/useUserRole', () => ({
  __esModule: true,
  default: () => ({ role: 'super_admin' }),
}));

jest.mock('../../config/tourSteps/visitorTourSteps', () => ({ getAllVisitorTours: () => [] }));
jest.mock('../../config/tourSteps/adminTourSteps', () => ({
  getAllAdminTours: () => [
    {
      id: 'admin-map-management',
      title: 'Map',
      description: 'Map tour',
      roles: ['super_admin'],
      scope: 'admin',
      path: '/admin/map',
    },
  ],
}));

const mockStart = jest.fn();
jest.mock('../../hooks/useOnboardingTour', () => ({
  __esModule: true,
  default: () => ({ start: mockStart }),
}));

const mockConfirm = jest.fn();
jest.mock('../../contexts/DialogContext', () => ({
  __esModule: true,
  useDialog: () => ({
    toastWarning: jest.fn(),
    toastInfo: jest.fn(),
    toastSuccess: jest.fn(),
    confirm: mockConfirm,
  }),
  DialogProvider: ({ children }) => children,
}));

import TourList from '../onboarding/TourList';

describe('TourList navigation cancel', () => {
  beforeEach(() => jest.clearAllMocks());

  test('cancelling the navigation prompt reopens Help and does not start the tour', async () => {
    mockConfirm.mockResolvedValue(false);
    const onClose = jest.fn();
    const onReopen = jest.fn();

    const { getByRole } = render(
      <TourList startSource="help" onClose={onClose} onReopen={onReopen} />,
    );
    fireEvent.click(getByRole('button', { name: /tour\.start/i }));

    await waitFor(() => expect(onReopen).toHaveBeenCalledTimes(1));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(mockContextStartTour).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
