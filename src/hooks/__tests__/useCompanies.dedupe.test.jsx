import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

jest.mock('../../supabaseClient', () => {
  const mockSelect = jest.fn(() => ({ order: jest.fn(() => Promise.resolve({ data: [], error: null })) }));
  const mockFrom = jest.fn(() => ({ select: mockSelect }));
  const mockOn = jest.fn().mockReturnThis();
  const mockSubscribe = jest.fn(() => ({ id: 'ch-comp' }));
  const mockChannel = jest.fn(() => ({ on: mockOn, subscribe: mockSubscribe }));
  const mockRemoveChannel = jest.fn();

  return {
    supabase: {
      from: mockFrom,
      channel: mockChannel,
      removeChannel: mockRemoveChannel,
    },
    __mocks__: { mockFrom, mockSelect, mockChannel, mockSubscribe, mockRemoveChannel, mockOn },
  };
});

import useCompanies from '../useCompanies';

function Probe({ id }) {
  const { companies, loading } = useCompanies();
  return <div data-testid={`p-${id}`}>{loading ? 'loading' : JSON.stringify(companies)}</div>;
}

describe('useCompanies cache/dedupe', () => {
  beforeEach(() => jest.clearAllMocks());

  it('runs single fetch and subscription regardless of multiple consumers', async () => {
    render(
      <div>
        <Probe id="a" />
        <Probe id="b" />
      </div>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('p-a').textContent).not.toMatch(/loading/);
      expect(screen.getByTestId('p-b').textContent).not.toMatch(/loading/);
    });

    const { supabase } = require('../../supabaseClient');
    expect(supabase.from).toHaveBeenCalledTimes(1);
    expect(supabase.from).toHaveBeenCalledWith('companies');
    expect(supabase.channel).toHaveBeenCalledTimes(1);
    expect(String(supabase.channel.mock.calls[0][0])).toMatch(/companies-changes/);
  });
});
