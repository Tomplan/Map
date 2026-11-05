import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';

jest.mock('../contexts/PreferencesContext', () => ({
  usePreferences: () => ({ preferences: null, loading: false, updatePreferences: jest.fn() }),
}));

jest.mock('../supabaseClient', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(() => Promise.resolve({ data: { user: null } })),
      onAuthStateChange: jest.fn(() => ({ subscription: { unsubscribe: jest.fn() } })),
    },
  },
}));

import { OnboardingProvider, useOnboarding } from '../contexts/OnboardingContext';

function Consumer() {
  const {
    activeTour,
    activeTourSource,
    isRunning,
    lastFailedTour,
    startTour,
    dismissTour,
    reportTourStartFailed,
    clearLastFailedTour,
  } = useOnboarding();

  return (
    <div>
      <div data-testid="active">{activeTour || 'none'}</div>
      <div data-testid="source">{activeTourSource || 'none'}</div>
      <div data-testid="running">{isRunning ? 'yes' : 'no'}</div>
      <div data-testid="failed">
        {lastFailedTour ? `${lastFailedTour.id}:${lastFailedTour.source}` : 'none'}
      </div>

      <button onClick={() => startTour('map', { source: 'help' })}>start-help</button>
      <button onClick={() => startTour('map')}>start-no-meta</button>
      <button onClick={() => startTour('other', { source: 'ui' })}>start-other</button>
      <button onClick={() => reportTourStartFailed('map')}>fail-map</button>
      <button onClick={() => dismissTour('map')}>dismiss</button>
      <button onClick={() => clearLastFailedTour()}>clear-failed</button>
    </div>
  );
}

const setup = () =>
  render(
    <OnboardingProvider>
      <Consumer />
    </OnboardingProvider>,
  );

describe('OnboardingContext start failures', () => {
  test('a failed start resets the running state and reports the source it came from', async () => {
    const { getByText, getByTestId } = setup();

    fireEvent.click(getByText('start-help'));
    await waitFor(() => expect(getByTestId('running').textContent).toBe('yes'));

    fireEvent.click(getByText('fail-map'));
    await waitFor(() => expect(getByTestId('failed').textContent).toBe('map:help'));
    expect(getByTestId('running').textContent).toBe('no');
    expect(getByTestId('active').textContent).toBe('none');
    expect(getByTestId('source').textContent).toBe('none');

    fireEvent.click(getByText('clear-failed'));
    await waitFor(() => expect(getByTestId('failed').textContent).toBe('none'));
  });

  test('a start without metadata keeps the source set by the earlier start', async () => {
    const { getByText, getByTestId } = setup();

    fireEvent.click(getByText('start-help'));
    await waitFor(() => expect(getByTestId('source').textContent).toBe('help'));

    fireEvent.click(getByText('start-no-meta'));
    await waitFor(() => expect(getByTestId('active').textContent).toBe('map'));
    expect(getByTestId('source').textContent).toBe('help');
  });

  test('a failed start does not tear down a different running tour', async () => {
    const { getByText, getByTestId } = setup();

    fireEvent.click(getByText('start-other'));
    await waitFor(() => expect(getByTestId('active').textContent).toBe('other'));

    fireEvent.click(getByText('fail-map'));
    expect(getByTestId('running').textContent).toBe('yes');
    expect(getByTestId('active').textContent).toBe('other');
    expect(getByTestId('failed').textContent).toBe('none');
  });

  test('dismissing a tour clears its source so later starts do not reopen Help', async () => {
    const { getByText, getByTestId } = setup();

    fireEvent.click(getByText('start-help'));
    await waitFor(() => expect(getByTestId('source').textContent).toBe('help'));

    fireEvent.click(getByText('dismiss'));
    await waitFor(() => expect(getByTestId('source').textContent).toBe('none'));
    expect(getByTestId('running').textContent).toBe('no');
  });
});
