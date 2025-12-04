import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';

jest.mock('../contexts/PreferencesContext', () => ({
  usePreferences: () => ({ preferences: null, loading: false, updatePreferences: jest.fn() })
}));

// mock supabase auth to avoid network calls
jest.mock('../supabaseClient', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(() => Promise.resolve({ data: { user: null } })),
      onAuthStateChange: jest.fn(() => ({ subscription: { unsubscribe: jest.fn() } })),
    }
  }
}));

import { OnboardingProvider, useOnboarding } from '../contexts/OnboardingContext';

function TestConsumer() {
  const { activeTour, activeTourSource, isRunning, lastCompletedTour, startTour, completeTour, clearLastCompletedTour } = useOnboarding();

  return (
    <div>
      <div data-testid="active">{activeTour || 'none'}</div>
      <div data-testid="source">{activeTourSource || 'none'}</div>
      <div data-testid="running">{isRunning ? 'yes' : 'no'}</div>
      <div data-testid="last">{lastCompletedTour ? `${lastCompletedTour.id}:${lastCompletedTour.source}` : 'none'}</div>

      <button onClick={() => startTour('tour-1', { source: 'help' })}>start</button>
      <button onClick={() => completeTour('tour-1')}>complete</button>
      <button onClick={() => clearLastCompletedTour()}>clear</button>
    </div>
  );
}

describe('OnboardingContext', () => {
  test('startTour sets activeTour and source, completeTour sets lastCompletedTour with source, clear resets', async () => {
    const { getByText, getByTestId } = render(
      <OnboardingProvider>
        <TestConsumer />
      </OnboardingProvider>
    );

    // start
    fireEvent.click(getByText('start'));
    await waitFor(() => expect(getByTestId('active').textContent).toBe('tour-1'));
    expect(getByTestId('source').textContent).toBe('help');
    expect(getByTestId('running').textContent).toBe('yes');

    // complete
    fireEvent.click(getByText('complete'));
    await waitFor(() => expect(getByTestId('last').textContent).toBe('tour-1:help'));
    expect(getByTestId('running').textContent).toBe('no');

    // clear
    fireEvent.click(getByText('clear'));
    await waitFor(() => expect(getByTestId('last').textContent).toBe('none'));
  });
});
