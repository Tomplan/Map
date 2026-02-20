import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

// Mock supabase client to count queries/subscriptions
jest.mock('../../supabaseClient', () => {
  const mockMaybeSingle = jest.fn().mockResolvedValue({ data: { id: 1, event_year: 2026 }, error: null });
  const mockSelect = jest.fn(() => ({ maybeSingle: mockMaybeSingle, eq: jest.fn(() => ({ maybeSingle: mockMaybeSingle })) }));
  const mockFrom = jest.fn(() => ({ select: mockSelect }));
  const mockOn = jest.fn().mockReturnThis();
  const mockSubscribe = jest.fn(() => ({ id: 'ch-ems-1' }));
  const mockChannel = jest.fn(() => ({ on: mockOn, subscribe: mockSubscribe }));
  const mockRemoveChannel = jest.fn();

  return {
    supabase: {
      from: mockFrom,
      channel: mockChannel,
      removeChannel: mockRemoveChannel,
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'u-1' } } }) },
    },
    __mocks__: { mockFrom, mockSelect, mockMaybeSingle, mockChannel, mockSubscribe, mockRemoveChannel, mockOn },
  };
});

import useEventMapSettings from '../useEventMapSettings';

function Probe({ year, id }) {
  const { settings, loading } = useEventMapSettings(year);
  return <div data-testid={`p-${id}`}>{loading ? 'loading' : JSON.stringify(settings)}</div>;
}

describe('useEventMapSettings cache/dedupe', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shares REST call and single realtime subscription for same year', async () => {
    render(
      <div>
        <Probe id="a" year={2026} />
        <Probe id="b" year={2026} />
      </div>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('p-a').textContent).toMatch(/"event_year":2026/);
      expect(screen.getByTestId('p-b').textContent).toMatch(/"event_year":2026/);
    });

    const { supabase } = require('../../supabaseClient');
    // single REST query for event_map_settings
    expect(supabase.from).toHaveBeenCalledTimes(1);
    expect(supabase.from).toHaveBeenCalledWith('event_map_settings');

    // single realtime channel created for that year
    expect(supabase.channel).toHaveBeenCalledTimes(1);
    expect(String(supabase.channel.mock.calls[0][0])).toMatch(/event-map-settings/);
  });
});
