import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

jest.mock('../../supabaseClient', () => {
  // simple mocks for from/select chain
  const mockMaybe = jest.fn().mockResolvedValue({ data: [], error: null });
  const mockOrder = jest.fn(() => Promise.resolve({ data: [], error: null }));
  const mockEq = jest.fn(() => ({ order: mockOrder }));
  const mockSelect = jest.fn(() => ({ eq: mockEq }));
  const mockFrom = jest.fn(() => ({ select: mockSelect }));

  const mockOn = jest.fn().mockReturnThis();
  const mockSubscribe = jest.fn(() => ({ id: 'ch-cats' }));
  const mockChannel = jest.fn(() => ({ on: mockOn, subscribe: mockSubscribe }));
  const mockRemoveChannel = jest.fn();

  return {
    supabase: {
      from: mockFrom,
      channel: mockChannel,
      removeChannel: mockRemoveChannel,
    },
    __mocks__: {
      mockFrom,
      mockSelect,
      mockEq,
      mockOrder,
      mockChannel,
      mockSubscribe,
      mockRemoveChannel,
      mockOn,
    },
  };
});

import { useCategories } from '../useCategories';

function Probe({ lang, id }) {
  const { categories, loading } = useCategories(lang);
  return <div data-testid={`p-${id}`}>{loading ? 'loading' : JSON.stringify(categories)}</div>;
}

describe('useCategories cache/dedupe', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shares REST calls and realtime channel for same language', async () => {
    render(
      <div>
        <Probe id="a" lang="nl" />
        <Probe id="b" lang="nl" />
      </div>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('p-a').textContent).not.toMatch(/loading/);
      expect(screen.getByTestId('p-b').textContent).not.toMatch(/loading/);
    });

    const { supabase } = require('../../supabaseClient');
    expect(supabase.from).toHaveBeenCalledTimes(1);
    expect(supabase.from).toHaveBeenCalledWith('categories');
    // two channels: one for category changes and one for stats
    expect(supabase.channel).toHaveBeenCalledTimes(2);
    const names = supabase.channel.mock.calls.map((c) => String(c[0]));
    expect(names.some((n) => /categories-changes/.test(n))).toBe(true);
    expect(names.some((n) => /company-categories-stats/.test(n))).toBe(true);
  });
});
