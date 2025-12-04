import React from 'react';
// jsdom in some environments doesn't provide TextEncoder — polyfill for react-router
const { TextEncoder } = require('util');
global.TextEncoder = global.TextEncoder || TextEncoder;
import { render, fireEvent, waitFor } from '@testing-library/react';

// Mock translations
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k) => k, i18n: { language: 'en' } }) }));

// Mock react-router so HelpPanel imports succeed without pulling in the full library
jest.mock('react-router-dom', () => ({ useLocation: () => ({ pathname: '/', hash: '' }), useNavigate: () => jest.fn() }));

// Mock onboarding hook. Export the mock startTour so tests can assert calls reliably.
jest.mock('../../contexts/OnboardingContext', () => {
  const mockStartTour = jest.fn();
  return { useOnboarding: () => ({ isRunning: false, isTourCompleted: () => false, startTour: mockStartTour }), __mockStartTour: mockStartTour };
});

// Avoid supabase network calls used in some hooks (useUserRole)
jest.mock('../../supabaseClient', () => ({ supabase: { auth: { getUser: jest.fn(() => Promise.resolve({ data: { user: null } })), onAuthStateChange: jest.fn(() => ({ subscription: { unsubscribe: jest.fn() } })) } } }));

// Mock user role to keep UI lightweight
jest.mock('../../hooks/useUserRole', () => ({ __esModule: true, default: () => ({ role: 'visitor', loading: false, hasAnyRole: () => false, userInfo: {} }) }));

// Mock tours/data used by TourList
jest.mock('../../config/tourSteps/visitorTourSteps', () => ({ getAllVisitorTours: () => ([{ id: 'visitor-welcome', title: 'Welcome', description: 'Welcome', scope: 'visitor' }]) }));
jest.mock('../../config/tourSteps/adminTourSteps', () => ({ getAllAdminTours: () => ([]) }));

// Mock the onboarding hook return used by TourList — return *no* local
// start function to force TrekList into the context-based start path.
jest.mock('../../hooks/useOnboardingTour', () => ({ __esModule: true, default: () => ({ start: undefined }) }));

// Mock dialog context (toast helpers and confirm) used by the TourList implementation
jest.mock('../../contexts/DialogContext', () => ({ __esModule: true, useDialog: () => ({ toastWarning: jest.fn(), toastInfo: jest.fn(), toastSuccess: jest.fn(), confirm: jest.fn(async () => true) }), DialogProvider: ({ children }) => children }));

import HelpPanel from '../HelpPanel';

describe('HelpPanel', () => {
  test('respects initialTab on open and renders interactive-tour content', () => {
    const { getByText } = render(<HelpPanel isOpen={true} onClose={() => {}} initialTab="interactive-tour" />);

    // The interactive-tour tab content title should be present
    expect(getByText('helpPanel.interactiveTourTitle')).toBeInTheDocument();
  });

  test('TourList inside HelpPanel stamps start with source=help', async () => {
    const { getByText } = render(<HelpPanel isOpen={true} onClose={() => {}} initialTab="interactive-tour" />);
    // dump the mocked useOnboardingTour module so we can inspect the exported mock
    console.log('useOnboardingTour module:', require('../../hooks/useOnboardingTour'));

    // Click the Start button
    const btn = getByText('tour.startTour');
    // debug output for failing test investigation
    console.log('BEFORE CLICK:', document.body.innerHTML);
    fireEvent.click(btn);
    console.log('AFTER CLICK:', document.body.innerHTML);

    // The local hook is absent so TourList should call the onboarding
    // context `startTour` fallback — wait for the async flow and assert
    // that it was invoked with the expected tour id and source.
    const { __mockStartTour } = require('../../contexts/OnboardingContext');
    await waitFor(() => expect(__mockStartTour).toHaveBeenCalled());
    const calledWith = __mockStartTour.mock.calls[0] || [];
    expect(calledWith[0]).toBe('visitor-welcome');
    expect(calledWith[1]).toBe('help');
  });
});
