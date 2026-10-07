import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

jest.mock('../../services/publicDataVersion', () => ({
  subscribePublicDataVersion: jest.fn(() => ({
    ready: Promise.resolve(),
    unsubscribe: jest.fn(),
  })),
}));

jest.mock('../../supabaseClient', () => {
  const chain = {
    order: jest.fn().mockReturnThis(),
    eq: jest.fn(() => Promise.resolve({ data: [], error: null })),
  };
  const mockOn = jest.fn().mockReturnThis();
  const mockChannel = jest.fn(() => ({ on: mockOn, subscribe: jest.fn() }));
  return {
    supabase: {
      auth: {
        getSession: jest.fn(() =>
          Promise.resolve({ data: { session: { user: { id: 'admin' } } } }),
        ),
      },
      from: jest.fn(() => ({ select: jest.fn(() => chain) })),
      channel: mockChannel,
      removeChannel: jest.fn(),
    },
  };
});

import useEventActivities from '../useEventActivities';
import { subscribePublicDataVersion } from '../../services/publicDataVersion';

function Probe() {
  const { loading } = useEventActivities(2026);
  return <div data-testid="p">{loading ? 'loading' : 'done'}</div>;
}

describe('useEventActivities realtime vs. version polling', () => {
  beforeEach(() => jest.clearAllMocks());

  it('opens a realtime channel for logged-in users only', async () => {
    const { supabase } = require('../../supabaseClient');
    render(<Probe />);
    await waitFor(() => expect(supabase.channel).toHaveBeenCalledTimes(1));
    expect(String(supabase.channel.mock.calls[0][0])).toMatch(/event-activities-changes-2026/);
    expect(subscribePublicDataVersion).not.toHaveBeenCalled();
  });

  it('concurrent mounts share one activities request', async () => {
    const { supabase } = require('../../supabaseClient');
    render(
      <div>
        <Probe />
        <Probe />
        <Probe />
      </div>,
    );
    await waitFor(() => expect(screen.getAllByTestId('p')[0].textContent).toBe('done'));
    expect(supabase.from.mock.calls.filter(([t]) => t === 'event_activities')).toHaveLength(1);
  });

  it('visitors use the version poller and open no channel', async () => {
    const { supabase } = require('../../supabaseClient');
    supabase.auth.getSession.mockResolvedValueOnce({ data: { session: null } });
    render(<Probe />);
    await waitFor(() => expect(subscribePublicDataVersion).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByTestId('p').textContent).toBe('done'));
    expect(supabase.channel).not.toHaveBeenCalled();
  });
});
