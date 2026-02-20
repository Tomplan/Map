import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

jest.mock('../../supabaseClient', () => {
  const mockSelect = jest.fn(() => ({ eq: jest.fn(() => ({ order: jest.fn(() => Promise.resolve({ data: [], error: null })) })) }));
  const mockFrom = jest.fn(() => ({ select: mockSelect }));
  const mockOn = jest.fn().mockReturnThis();
  const mockSubscribe = jest.fn(() => ({ id: 'ch-asgn' }));
  const mockChannel = jest.fn(() => ({ on: mockOn, subscribe: mockSubscribe }));
  const mockRemoveChannel = jest.fn();

  return {
    supabase: {
      from: mockFrom,
      channel: mockChannel,
      removeChannel: mockRemoveChannel,
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { email: 'test@example.com' } } }) },
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
    expect(supabase.channel).toHaveBeenCalledTimes(1);
    expect(String(supabase.channel.mock.calls[0][0])).toMatch(/assignments-changes-2026/);
  });
});
