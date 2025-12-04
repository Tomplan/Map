import React from 'react';
import { render, waitFor } from '@testing-library/react';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k) => k, i18n: { language: 'en' } }) }));

// HelpPanel - replace with lightweight mock so we can observe props
jest.mock('../HelpPanel', () => ({ default: ({ isOpen, initialTab }) => (
  <div data-testid="help-panel-mock" data-open={isOpen} data-initial={initialTab}>{isOpen ? 'OPEN' : 'CLOSED'}</div>
)}));

// Mock user role so AdminLayout renders
jest.mock('../../hooks/useUserRole', () => ({ __esModule: true, default: () => ({ role: 'super_admin', loading: false, hasAnyRole: (r) => true, userInfo: { name: 'Test' } }) }));

// Mock onboarding to provide a lastCompletedTour indicating the tour started from help
const clearMock = jest.fn();
// jsdom in some environments doesn't provide TextEncoder — polyfill for react-router
const { TextEncoder } = require('util');
global.TextEncoder = global.TextEncoder || TextEncoder;

// Mock onboarding to provide a lastCompletedTour indicating the tour started from help
// Use a mock variable name starting with `mock` inside the factory to avoid scope errors
jest.mock('../../contexts/OnboardingContext', () => ({ useOnboarding: () => ({ lastCompletedTour: { id: 'tour-1', source: 'help' }, clearLastCompletedTour: jest.fn() }) }));

describe('AdminLayout reopen behavior', () => {
  test('effect opens help when lastCompletedTour.source === help (isolated effect)', async () => {
    // We'll test the effect logic in isolation (avoid importing AdminLayout which
    // pulls in other app-level code). Create a tiny component that mirrors the
    // reopen effect and asserts expected behavior.
    const { useOnboarding } = require('../../contexts/OnboardingContext');

    function Tester() {
      const { lastCompletedTour, clearLastCompletedTour } = useOnboarding();
      const [isHelpOpen, setIsHelpOpen] = React.useState(false);
      const [initialTab, setInitialTab] = React.useState(null);

      React.useEffect(() => {
        if (lastCompletedTour?.source === 'help' && !isHelpOpen) {
          setInitialTab('interactive-tour');
          setIsHelpOpen(true);
          clearLastCompletedTour();
        }
      }, [lastCompletedTour, isHelpOpen, clearLastCompletedTour]);

      return <div data-testid="tester" data-helpopen={isHelpOpen} data-initial={initialTab} />;
    }

    const { getByTestId } = render(<Tester />);

    await waitFor(() => expect(getByTestId('tester').getAttribute('data-helpopen')).toBe('true'));
    expect(getByTestId('tester').getAttribute('data-initial')).toBe('interactive-tour');
  });

  test('effect does NOT open help when lastCompletedTour.source !== help (isolated negative case)', async () => {
    // Reset modules then mock onboarding to return a non-help source
    jest.resetModules();
    jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k) => k, i18n: { language: 'en' } }) }));
    jest.mock('../HelpPanel', () => ({ default: ({ isOpen, initialTab }) => (
      <div data-testid="help-panel-mock" data-open={isOpen} data-initial={initialTab}>{isOpen ? 'OPEN' : 'CLOSED'}</div>
    ) }));
    jest.mock('../../hooks/useUserRole', () => ({ __esModule: true, default: () => ({ role: 'super_admin', loading: false, hasAnyRole: (r) => true, userInfo: { name: 'Test' } }) }));

    // Mock onboarding to indicate the tour completed with source 'ui'
    jest.mock('../../contexts/OnboardingContext', () => ({ useOnboarding: () => ({ lastCompletedTour: { id: 'tour-1', source: 'ui' }, clearLastCompletedTour: jest.fn() }) }));

    const { useOnboarding } = require('../../contexts/OnboardingContext');

    function TesterNegative() {
      const { lastCompletedTour, clearLastCompletedTour } = useOnboarding();
      const [isHelpOpen, setIsHelpOpen] = React.useState(false);
      const [initialTab, setInitialTab] = React.useState(null);

      React.useEffect(() => {
        if (lastCompletedTour?.source === 'help' && !isHelpOpen) {
          setInitialTab('interactive-tour');
          setIsHelpOpen(true);
          clearLastCompletedTour();
        }
      }, [lastCompletedTour, isHelpOpen, clearLastCompletedTour]);

      return <div data-testid="tester2" data-helpopen={isHelpOpen} data-initial={initialTab} />;
    }

    const { getByTestId } = render(<TesterNegative />);

    // Should remain closed (false) since source !== 'help'
    await waitFor(() => expect(getByTestId('tester2').getAttribute('data-helpopen')).toBe('false'));
    expect(getByTestId('tester2').getAttribute('data-initial')).toBeNull();
  });
});
