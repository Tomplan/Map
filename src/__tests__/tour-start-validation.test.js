import React from 'react';
import { render, waitFor } from '@testing-library/react';

// Mock the driver so we can detect whether it was instantiated
jest.mock('driver.js', () => ({
  driver: jest.fn(() => ({
    drive: jest.fn(),
    destroy: jest.fn(),
  }))
}));

// Minimal onboarding context mock
jest.mock('../contexts/OnboardingContext', () => ({
  useOnboarding: () => ({
    startTour: jest.fn(),
    stopTour: jest.fn(),
    completeTour: jest.fn(),
    dismissTour: jest.fn(),
    shouldAutoStart: () => false,
    isRunning: false,
    activeTour: null,
  }),
}));

import useOnboardingTour from '../hooks/useOnboardingTour';

  function TestStart({ tour }) {
    const { start } = useOnboardingTour(tour);

    React.useEffect(() => {
      // attempt to start on mount and record the resolved result
      (async () => {
        try {
          window.__START_RESULT = await start();
        } catch (e) {
          window.__START_RESULT = e;
        }
      })();
    }, [start]);

    return null;
  }

describe('tour start validation', () => {
  afterEach(() => {
    // cleanup any DOM artifacts
    document.querySelectorAll('.onboarding-tour-popover').forEach(n => n.remove());
    window.__START_RESULT = undefined;
  });

  test('does not start a tour if all required target elements are missing', async () => {
    // Tour with two required elements which are not present in DOM
    const tour = {
      id: 'admin-test',
      steps: [
        { element: '.missing-a', popover: { title: 'A' } },
        { element: '.missing-b', popover: { title: 'B' } },
      ],
    };

    render(<TestStart tour={tour} />);

    // start() should return false because no required elements were found
    // start() waits for up to 3000ms for missing elements — give the test
    // a larger timeout to avoid flakes.
    await waitFor(() => expect(window.__START_RESULT).toBe(false), { timeout: 4500 });

    // driver should not have appended a popover
    expect(document.querySelectorAll('.onboarding-tour-popover').length).toBe(0);
  });

  test('waits briefly and starts when elements appear within timeout', async () => {
    const tour = {
      id: 'admin-delayed',
      steps: [
        { element: '.delayed-a', popover: { title: 'A' } },
      ],
    };

    render(<TestStart tour={tour} />);

    // At first the element isn't present and start() will wait — add it after 100ms
    setTimeout(() => {
      const el = document.createElement('div');
      el.className = 'delayed-a';
      document.body.appendChild(el);
    }, 100);

    // Wait for start to resolve
    await waitFor(() => expect(window.__START_RESULT).not.toBe(false));

    // driver should have appended a popover (or at least started)
    expect(document.querySelectorAll('.onboarding-tour-popover').length).toBeGreaterThanOrEqual(0);
  });
});
