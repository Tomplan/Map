import React from 'react'
import { render, fireEvent } from '@testing-library/react'

// Mock translations
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (k, vars) => {
      if (k === 'tour.duration') return `${vars.minutes} minutes`
      return k
    },
    i18n: { language: 'en' }
  })
}))

// Mock react-router location (use a tunable mock so tests can change pathname)
const mockUseLocation = jest.fn(() => ({ pathname: '/' }));
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({ useLocation: () => mockUseLocation(), useNavigate: () => mockNavigate }))

// Mock onboarding context and hooks
jest.mock('../../contexts/OnboardingContext', () => ({
  useOnboarding: () => ({ isTourCompleted: (id) => id === 'completed-tour' })
}))

// Tunable mock for user role so tests can flip roles
const mockUseUserRole = jest.fn(() => ({ role: 'visitor' }));
jest.mock('../../hooks/useUserRole', () => ({ __esModule: true, default: () => mockUseUserRole() }))

// Mock the tours config modules
jest.mock('../../config/tourSteps/visitorTourSteps', () => ({
  getAllVisitorTours: () => ([
    { id: 'visitor-welcome', title: 'Welcome', description: 'Welcome tour', scope: 'visitor' },
    { id: 'completed-tour', title: 'Completed', description: 'Already done', scope: 'visitor' }
  ])
}))

jest.mock('../../config/tourSteps/adminTourSteps', () => ({
  getAllAdminTours: () => ([{ id: 'admin-first', title: 'Admin', description: 'Admin tour', roles: ['admin'], scope: 'admin' }])
}))

// Mock the onboarding hook which returns start function used by TourCard
const mockStart = jest.fn();
jest.mock('../../hooks/useOnboardingTour', () => ({ __esModule: true, default: (tour) => ({ start: mockStart }) }))

// Mock dialog context (toast helpers and confirm)
const mockToastWarning = jest.fn();
const mockConfirm = jest.fn(async () => true);
jest.mock('../../contexts/DialogContext', () => ({ __esModule: true, useDialog: () => ({ toastWarning: mockToastWarning, toastInfo: jest.fn(), toastSuccess: jest.fn(), confirm: mockConfirm }), DialogProvider: ({ children }) => children }))

import TourList from '../onboarding/TourList'

describe('TourList', () => {
  test('renders available tours for visitor and allows start', () => {
    const { getByText, getAllByRole } = render(<TourList />)

    // Should show visitor tours (two from mock)
    expect(getByText('Welcome')).toBeInTheDocument()
    expect(getByText('Completed')).toBeInTheDocument()

    // Start/restart buttons exist on both cards (2 buttons expected)
    const buttons = getAllByRole('button')
    expect(buttons.length).toBeGreaterThanOrEqual(2)
  })

  test('on admin route visitor tours are hidden and admin tours are shown', () => {
    mockUseLocation.mockReturnValue({ pathname: '/admin' });
    mockUseUserRole.mockReturnValue({ role: 'super_admin' });

    const { queryByText, getByText } = render(<TourList />);

    // visitor tours should not be present
    expect(queryByText('Welcome')).not.toBeInTheDocument();

    // admin tour should be present
    expect(getByText('Admin')).toBeInTheDocument();
  });

  test('shows no tours when none available', () => {
    const visitorModule = require('../../config/tourSteps/visitorTourSteps')
    const adminModule = require('../../config/tourSteps/adminTourSteps')
    const onboardingCtx = require('../../contexts/OnboardingContext')

    const visitorSpy = jest.spyOn(visitorModule, 'getAllVisitorTours').mockReturnValue([])
    const adminSpy = jest.spyOn(adminModule, 'getAllAdminTours').mockReturnValue([])
    const onboardSpy = jest.spyOn(onboardingCtx, 'useOnboarding').mockImplementation(() => ({ isTourCompleted: () => false }))

    const { getByText } = render(<TourList />)
    expect(getByText('tour.noToursAvailable')).toBeInTheDocument()

    // restore spies
    visitorSpy.mockRestore()
    adminSpy.mockRestore()
    onboardSpy.mockRestore()
  })

  test('when start() returns false show toast warning', async () => {
    // ensure start resolves false
    mockStart.mockReset();
    mockStart.mockResolvedValueOnce(false);

    const { getAllByRole } = render(<TourList />)
    const buttons = getAllByRole('button')

    // Click the first start-like button
    buttons[0].click()

    // Wait a tick for the promise chain
    await new Promise((r) => setTimeout(r, 100))

    expect(mockToastWarning).toHaveBeenCalled()
  })

  test('when admin tour is visible and start fails it navigates to admin and retries', async () => {
    // Ensure we're on a visitor route to demonstrate auto-navigate
    mockUseLocation.mockReturnValue({ pathname: '/' });
    mockUseUserRole.mockReturnValue({ role: 'super_admin' });

    // Replace tour lists so an admin tour (without scope) is visible on any route
    const adminModule = require('../../config/tourSteps/adminTourSteps');
    const adminSpy = jest.spyOn(adminModule, 'getAllAdminTours').mockReturnValue([{ id: 'admin-dashboard', title: 'Admin Tour' }]);
    const visitorModule = require('../../config/tourSteps/visitorTourSteps');
    const visitorSpy = jest.spyOn(visitorModule, 'getAllVisitorTours').mockReturnValue([]);

    // Simulate start() first failing then succeeding on retry
    mockStart.mockReset();
    mockStart.mockResolvedValueOnce(false).mockResolvedValueOnce(true);

    // Render and click start
    const { getAllByRole } = render(<TourList />);
    const btns = getAllByRole('button');
    btns[0].click();

    // Wait for retry delay + promise chain (longer since UI shows a confirm first)
    await new Promise((r) => setTimeout(r, 1000));

    // Expect navigate to have been called to '/admin' and start retried
    const { useNavigate } = require('react-router-dom');
    const mockNavigate = useNavigate();
    expect(mockNavigate).toHaveBeenCalledWith('/admin');
    expect(mockStart).toHaveBeenCalledTimes(2);

    // Cleanup spies
    adminSpy.mockRestore();
    visitorSpy.mockRestore();
  })
  

  test('start remains actionable for admin-prefixed tours even when required targets are missing', () => {
    mockUseLocation.mockReturnValue({ pathname: '/admin' });
    mockUseUserRole.mockReturnValue({ role: 'super_admin' });

    // Admin tour requires a .year-selector element which is absent
    const adminModule = require('../../config/tourSteps/adminTourSteps');
    const adminSpy = jest.spyOn(adminModule, 'getAllAdminTours').mockReturnValue([
      { id: 'admin-dashboard', title: 'Admin Tour', steps: [{ element: '.year-selector' }] }
    ]);
    const visitorModule = require('../../config/tourSteps/visitorTourSteps');
    const visitorSpy = jest.spyOn(visitorModule, 'getAllVisitorTours').mockReturnValue([]);

    const { getByRole } = render(<TourList />)
    const btn = getByRole('button')
    // Admin-prefixed tours are intentionally kept actionable so the app
    // can navigate or let start() perform its preflight (wait/abort)
    expect(btn).not.toBeDisabled()

    adminSpy.mockRestore();
    visitorSpy.mockRestore();
  })

  test('enables Start when required targets are present', () => {
    mockUseLocation.mockReturnValue({ pathname: '/admin' });
    mockUseUserRole.mockReturnValue({ role: 'super_admin' });

    // Inject the required target into the DOM
    const holder = document.createElement('div');
    holder.className = 'year-selector';
    document.body.appendChild(holder);

    const adminModule = require('../../config/tourSteps/adminTourSteps');
    const adminSpy = jest.spyOn(adminModule, 'getAllAdminTours').mockReturnValue([
      { id: 'admin-dashboard', title: 'Admin Tour', steps: [{ element: '.year-selector' }] }
    ]);
    const visitorModule = require('../../config/tourSteps/visitorTourSteps');
    const visitorSpy = jest.spyOn(visitorModule, 'getAllVisitorTours').mockReturnValue([]);

    const { getByRole } = render(<TourList />)
    const btn = getByRole('button')
    expect(btn).not.toBeDisabled()

    // cleanup
    adminSpy.mockRestore();
    visitorSpy.mockRestore();
    holder.remove();
  })
})
