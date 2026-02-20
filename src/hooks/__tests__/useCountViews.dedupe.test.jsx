import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

// Mock the supabase client so we can count queries/subscriptions
jest.mock('../../supabaseClient', () => {
  const mockMaybeSingle = jest.fn().mockResolvedValue({ data: { count: 123 }, error: null });
  const mockSelect = jest.fn(() => {
    const obj = {
      maybeSingle: mockMaybeSingle,
      single: mockMaybeSingle,
      eq: jest.fn(() => ({ maybeSingle: mockMaybeSingle, single: mockMaybeSingle })),
    };
    return obj;
  });
  const mockFrom = jest.fn(() => ({ select: mockSelect }));
  const mockOn = jest.fn().mockReturnThis();
  const mockSubscribe = jest.fn(() => ({ id: 'ch-1' }));
  const mockChannel = jest.fn(() => ({ on: mockOn, subscribe: mockSubscribe }));
  const mockRemoveChannel = jest.fn();

  return {
    supabase: {
      from: mockFrom,
      channel: mockChannel,
      removeChannel: mockRemoveChannel,
    },
    // expose mocks for assertions
    __mocks__: { mockFrom, mockSelect, mockMaybeSingle, mockChannel, mockSubscribe, mockRemoveChannel, mockOn },
  };
});

import { useSubscriptionCount } from '../useCountViews';

function ProbeSubscription({ year, id }) {
  const { count, loading, error } = useSubscriptionCount(year);
  return <div data-testid={`sub-${id}`}>{JSON.stringify({ count, loading, error })}</div>;
}

describe('useCountViews dedupe/cache', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('dedupes initial REST call and realtime channel for same event year', async () => {
    render(
      <div>
        <ProbeSubscription id="a" year={2026} />
        <ProbeSubscription id="b" year={2026} />
      </div>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('sub-a').textContent).toMatch(/"count":123/);
      expect(screen.getByTestId('sub-b').textContent).toMatch(/"count":123/);
    });

    // supabase.from should be called exactly once for subscription_counts
    const { supabase, __mocks__ } = require('../../supabaseClient');
    expect(supabase.from).toHaveBeenCalledTimes(1);
    expect(supabase.from).toHaveBeenCalledWith('subscription_counts');

    // realtime channel should also be created only once for that table/year
    expect(supabase.channel).toHaveBeenCalledTimes(1);
    expect(String(supabase.channel.mock.calls[0][0])).toMatch(/subscription_counts/);
  });
});
