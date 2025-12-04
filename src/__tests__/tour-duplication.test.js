import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';

// Mock useOnboarding context used by the hook
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

// Mock driver.js to append/remove a popover DOM node when drive/destroy are called
jest.mock('driver.js', () => ({ driver: jest.fn() }));

import useOnboardingTour from '../hooks/useOnboardingTour';

function TestHarness() {
  const { start } = useOnboardingTour({ id: 'test-dup', steps: [{ element: 'body', popover: { title: 't', description: 'd' } }] });
  return <button data-testid="start" onClick={start}>Start</button>;
}

function AutoStartHarness() {
  const { start } = useOnboardingTour({ id: 'test-dup', steps: [{ element: 'body', popover: { title: 't', description: 'd' } }] });

  React.useEffect(() => {
    // simulate rapid double-starts
    start();
    start();
  }, [start]);

  return null;
}

describe('duplicate popover guard', () => {
  beforeEach(() => {
    // give the mocked driver a runtime implementation which manipulates the DOM
    const { driver } = require('driver.js');
    driver.mockImplementation((config = {}) => ({
      drive: jest.fn(() => {
        const el = document.createElement('div');
        el.className = 'driver-popover onboarding-tour-popover';
        el.innerHTML = `
          <button class="driver-popover-prev-btn">Prev</button>
          <button class="driver-popover-next-btn">Next</button>
        `;

        document.body.appendChild(el);

        // simulate driver invoking onPopoverRender callback
        if (typeof config.onPopoverRender === 'function') {
          config.onPopoverRender({ wrapper: el });
        }
      }),
      destroy: jest.fn(() => {
        const p = document.querySelector('.onboarding-tour-popover');
        if (p) p.remove();
      }),
      getActiveIndex: jest.fn(() => 0),
      moveNext: jest.fn(() => { window.__TEST_NEXT_CLICKED = (window.__TEST_NEXT_CLICKED || 0) + 1; }),
      movePrevious: jest.fn(() => { window.__TEST_PREV_CLICKED = (window.__TEST_PREV_CLICKED || 0) + 1; }),
    }));

    // reset test counters and DOM
    window.__TEST_NEXT_CLICKED = 0;
    document.querySelectorAll('.onboarding-tour-popover').forEach(n => n.remove());
  });

  test('starting twice quickly does not create duplicate popovers and nav works', async () => {
    // Render a version that auto-starts the tour twice immediately
    render(<AutoStartHarness />);

    // Wait for driver factory to be called and for drive() to append the DOM
    const { driver } = require('driver.js');
    await waitFor(() => expect(driver).toHaveBeenCalled());

    // the hook sets a window-level global driver instance; ensure only one global exists
    expect(typeof window.__ONBOARDING_DRIVER_INSTANCE).not.toBe('undefined');

    // Some environments will create the popover slightly asynchronously
    await waitFor(() => expect(document.querySelectorAll('.onboarding-tour-popover').length).toBeLessThanOrEqual(1));

    const popovers = document.querySelectorAll('.onboarding-tour-popover');
    expect(popovers.length).toBe(1);

    // Click the next button and confirm handler fired
    const nextBtn = popovers[0].querySelector('.driver-popover-next-btn');
    expect(nextBtn).not.toBeNull();

    // wait for our fail-safe handler to be attached
    await waitFor(() => expect(nextBtn.hasAttribute('data-tour-handler')).toBe(true));

    fireEvent.click(nextBtn);

    expect(window.__TEST_NEXT_CLICKED).toBe(1);
  });
});
