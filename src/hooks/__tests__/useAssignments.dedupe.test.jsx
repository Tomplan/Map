import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

jest.mock('../../supabaseClient', () => {
  const mockChain = {
    eq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    order: jest.fn().mockResolvedValue({ data: [], error: null }),
    then: jest.fn((cb) => Promise.resolve({ data: [], error: null }).then(cb)),
  };
  const mockSelect = jest.fn(() => mockChain);
  const mockFrom = jest.fn(() => ({ select: mockSelect }));
  const mockOn = jest.fn().mockReturnThis();
  const mockSubscribe = jest.fn(() => ({ id: 'ch-asgn' }));
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

import useAssignments from '../useAssignments';

function Probe({ year, id }) {
  const { assignments, loading } = useAssignments(year);
  return <div data-testid={`p-${id}`}>{loading ? 'loading' : JSON.stringify(assignments)}</div>;
}

describe('useAssignments cache/dedupe', () => {
  beforeEach(() => jest.clearAllMocks());

  it('fetches markers and assignments once per year and subscribes once', async () => {
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
    // markers_core followed by assignments
    expect(supabase.from).toHaveBeenCalledTimes(2);
    expect(supabase.from).toHaveBeenNthCalledWith(1, 'markers_core');
    expect(supabase.from).toHaveBeenNthCalledWith(2, 'assignments');
    await waitFor(() => expect(supabase.channel).toHaveBeenCalledTimes(1));
    expect(String(supabase.channel.mock.calls[0][0])).toMatch(/assignments-changes-2026/);
  });

  it('does not open a realtime channel for anonymous visitors', async () => {
    const { supabase } = require('../../supabaseClient');
    supabase.auth.getSession.mockResolvedValueOnce({ data: { session: null } });

    render(<Probe id="v" year={2027} />);

    await waitFor(() => expect(screen.getByTestId('p-v').textContent).not.toMatch(/loading/));
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(supabase.channel).not.toHaveBeenCalled();
    // visitors still load the data once
    expect(supabase.from).toHaveBeenCalledWith('assignments');
  });

  it('removes the channel when the last logged-in consumer unmounts', async () => {
    const { supabase } = require('../../supabaseClient');

    const { unmount } = render(<Probe id="l" year={2028} />);
    await waitFor(() => expect(supabase.channel).toHaveBeenCalledTimes(1));

    unmount();
    expect(supabase.removeChannel).toHaveBeenCalledTimes(1);
  });
});
