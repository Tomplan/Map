/* eslint-env jest */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import useFeedbackRequests from '../src/hooks/useFeedbackRequests';
import * as supabaseClient from '../src/supabaseClient';

function TestHarness() {
  const { requests, loading } = useFeedbackRequests();
  return <div data-testid="requests">{loading ? 'loading' : JSON.stringify(requests)}</div>;
}

describe('useFeedbackRequests realtime subscription guard', () => {
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

  test('does not create realtime channels when offline', async () => {
    render(<TestHarness />);

    await waitFor(() => expect(screen.getByTestId('requests').textContent).not.toBe('loading'));

    expect(client.channel).not.toHaveBeenCalled();
  });
});
