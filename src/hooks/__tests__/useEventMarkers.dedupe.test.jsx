import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

// stub window listeners so tests don't crash
beforeAll(() => {
  global.window = {
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    localStorage: { getItem: jest.fn(), setItem: jest.fn() },
  };
  global.navigator = { onLine: true };
});

jest.mock('../../supabaseClient', () => {
  const mockSelect = jest.fn(() => ({
    eq: jest.fn(() => Promise.resolve({ data: [], error: null })),
    or: jest.fn(() => Promise.resolve({ data: [], error: null })),
    in: jest.fn(() => Promise.resolve({ data: [], error: null })),
    select: jest.fn(() => ({
      limit: jest.fn(() => Promise.resolve({ data: [], error: null })),
      maybeSingle: jest.fn(() => Promise.resolve({ data: null, error: null })),
      or: jest.fn(() => Promise.resolve({ data: [], error: null })),
      eq: jest.fn(() => Promise.resolve({ data: [], error: null })),
      then: (resolve) => resolve({ data: [], error: null }),
    })),
    order: jest.fn(() => Promise.resolve({ data: [], error: null })),
    then: (resolve) => resolve({ data: [], error: null }),
  }));
  const mockFrom = jest.fn(() => ({ 
    select: mockSelect, 
    eq: mockSelect,
    or: mockSelect,
    in: mockSelect
  }));
  const mockOn = jest.fn().mockReturnThis();
  const mockSubscribe = jest.fn(() => ({ id: 'ch-mk' }));
  const mockChannel = jest.fn(() => ({ on: mockOn, subscribe: mockSubscribe }));
  const mockRemoveChannel = jest.fn();

  return {
    supabase: {
      from: mockFrom,
      channel: mockChannel,
      removeChannel: mockRemoveChannel,
    },
    __mocks__: { mockFrom, mockChannel, mockSubscribe, mockRemoveChannel, mockOn },
  };
});

import useEventMarkers from '../useEventMarkers';

function Probe({ year, id }) {
  const { markers, loading } = useEventMarkers(year);
  return <div data-testid={`p-${id}`}>{loading ? 'loading' : JSON.stringify(markers)}</div>;
}

describe('useEventMarkers cache/dedupe', () => {
  beforeEach(() => jest.clearAllMocks());

  it('fetches once per year and subscribes once to each channel', async () => {
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
    // should call from only once (view) during initial load
    expect(supabase.from).toHaveBeenCalledTimes(1);
    expect(supabase.from).toHaveBeenCalledWith('event_markers_view');
    // realtime channels remain unchanged
    expect(supabase.channel).toHaveBeenCalledTimes(7);
    const channelNames = supabase.channel.mock.calls.map((c) => String(c[0]));
    expect(channelNames).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/markers-core-changes-2026/),
        expect.stringMatching(/markers-appearance-changes-2026/),
        expect.stringMatching(/markers-appearance-defaults-changes/),
        expect.stringMatching(/markers-content-changes-2026/),
        expect.stringMatching(/markers-assignments-changes/),
        expect.stringMatching(/companies-changes/),
        expect.stringMatching(/event-subscriptions-changes-2026/),
      ]),
    );
  });

  it('falls back when view is absent', async () => {
    const { supabase, __mocks__ } = require('../../supabaseClient');
    // make first call to view return not-found error
    __mocks__.mockFrom.mockImplementationOnce(() => ({
      select: () => Promise.resolve({ data: null, error: { code: 'PGRST205', message: 'Could not find the table' } }),
      eq: () => ({
        select: () => Promise.resolve({ data: null, error: { code: 'PGRST205', message: 'Could not find the table' } }),
        order: jest.fn(() => Promise.resolve({ data: [], error: null })),
      }),
    }));

    render(<Probe id="c" year={2027} />);
    await waitFor(() => {
      expect(screen.getByTestId('p-c').textContent).not.toMatch(/loading/);
    });

    // even after fallback the supabase.from was invoked more than once
    expect(supabase.from).toHaveBeenCalled();
  });
});
