import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

jest.mock('../../supabaseClient', () => {
  const mockSelect = jest.fn(() => ({
    eq: jest.fn(() => ({ order: jest.fn(() => Promise.resolve({ data: [], error: null })) })),
  }));
  const mockFrom = jest.fn(() => ({ select: mockSelect }));
  const mockOn = jest.fn().mockReturnThis();
  const mockSubscribe = jest.fn(() => ({ id: 'ch-sub' }));
  const mockChannel = jest.fn(() => ({ on: mockOn, subscribe: mockSubscribe }));
  const mockRemoveChannel = jest.fn();

  return {
    supabase: {
      auth: {
        getSession: jest.fn(() =>
          Promise.resolve({ data: { session: { user: { id: 'admin' } } } }),
        ),
        getUser: jest.fn().mockResolvedValue({ data: { user: { email: 'test@example.com' } } }),
      },
      from: mockFrom,
      channel: mockChannel,
      removeChannel: mockRemoveChannel,
    },
    __mocks__: { mockFrom, mockSelect, mockChannel, mockSubscribe, mockRemoveChannel, mockOn },
  };
});

import useEventSubscriptions from '../useEventSubscriptions';

function Probe({ year, id }) {
  const { subscriptions, loading } = useEventSubscriptions(year);
  return <div data-testid={`p-${id}`}>{loading ? 'loading' : JSON.stringify(subscriptions)}</div>;
}

function DisabledProbe({ year }) {
  const { loading } = useEventSubscriptions(year, { enabled: false });
  return <div data-testid="disabled">{loading ? 'loading' : 'idle'}</div>;
}

describe('useEventSubscriptions cache/dedupe', () => {
  beforeEach(() => jest.clearAllMocks());

  it('fetches once and subscribes once per year', async () => {
    render(
      <div>
        <Probe id="a" year={2026} />
        <Probe id="b" year={2026} />
      </div>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('p-a').textContent).not.toMatch(/loading/);
      expect(screen.getByTestId('p-b').textContent).not.toMatch(/loading/);
    });

    const { supabase } = require('../../supabaseClient');
    expect(supabase.from).toHaveBeenCalledTimes(1);
    expect(supabase.from).toHaveBeenCalledWith('event_subscriptions');
    await waitFor(() => expect(supabase.channel).toHaveBeenCalledTimes(1));
    expect(String(supabase.channel.mock.calls[0][0])).toMatch(/event-subscriptions-changes-2026/);
  });

  it('does not open a realtime channel for anonymous visitors', async () => {
    const { supabase } = require('../../supabaseClient');
    supabase.auth.getSession.mockResolvedValueOnce({ data: { session: null } });

    render(<Probe id="v" year={2027} />);

    await waitFor(() => expect(screen.getByTestId('p-v').textContent).not.toMatch(/loading/));
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(supabase.channel).not.toHaveBeenCalled();
    expect(supabase.from).toHaveBeenCalledWith('event_subscriptions');
  });

  it('does not load or subscribe when disabled (visitors)', async () => {
    const { supabase } = require('../../supabaseClient');
    render(<DisabledProbe year={2029} />);

    expect(screen.getByTestId('disabled').textContent).toBe('idle');
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(supabase.from).not.toHaveBeenCalled();
    expect(supabase.channel).not.toHaveBeenCalled();
  });

  it('removes the channel when the last logged-in consumer unmounts', async () => {
    const { supabase } = require('../../supabaseClient');

    const { unmount } = render(<Probe id="l" year={2028} />);
    await waitFor(() => expect(supabase.channel).toHaveBeenCalledTimes(1));

    unmount();
    expect(supabase.removeChannel).toHaveBeenCalledTimes(1);
  });
});
