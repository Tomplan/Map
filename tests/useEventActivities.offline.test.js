/* eslint-env jest */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import useEventActivities from '../src/hooks/useEventActivities';
import * as supabaseClient from '../src/supabaseClient';

function TestHarness() {
  const { activities, loading } = useEventActivities(2025);
  return <div data-testid="activities">{loading ? 'loading' : JSON.stringify(activities)}</div>;
}

describe('useEventActivities realtime subscription guard', () => {
  let client;

  beforeEach(() => {
    // Force offline environment
    Object.defineProperty(window.navigator, 'onLine', { value: false, configurable: true });

    // Spy on the underlying test client channel method
    client = supabaseClient.getSupabase();
    jest.spyOn(client, 'channel');
  });

  afterEach(() => {
    // Restore online state and spies
    Object.defineProperty(window.navigator, 'onLine', { value: true, configurable: true });
    if (client && client.channel && client.channel.mockRestore) client.channel.mockRestore();
  });

  test('does not create a realtime channel when offline', async () => {
    render(<TestHarness />);

    await waitFor(() => expect(screen.getByTestId('activities').textContent).not.toBe('loading'));

    expect(client.channel).not.toHaveBeenCalled();
  });
});
