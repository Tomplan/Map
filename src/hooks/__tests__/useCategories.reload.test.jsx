import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';

jest.mock('../../supabaseClient', () => {
  const rows = [
    {
      id: 1,
      slug: 'food',
      icon: null,
      color: '#fff',
      sort_order: 1,
      active: true,
      category_translations: [{ language: 'nl', name: 'Eten', description: '' }],
    },
  ];
  const mockOrder = jest.fn(() => Promise.resolve({ data: rows, error: null }));
  const mockEq = jest.fn(() => ({ order: mockOrder }));
  const mockSelect = jest.fn(() => ({ eq: mockEq }));
  const mockFrom = jest.fn(() => ({ select: mockSelect }));

  const mockOn = jest.fn().mockReturnThis();
  const mockChannel = jest.fn(() => ({ on: mockOn, subscribe: jest.fn(() => ({})) }));

  return {
    supabase: {
      auth: {
        getSession: jest.fn(() =>
          Promise.resolve({ data: { session: { user: { id: 'admin' } } } }),
        ),
      },
      from: mockFrom,
      channel: mockChannel,
      removeChannel: jest.fn(),
    },
    __mocks__: { mockOn },
  };
});

import { useCategories } from '../useCategories';

let latest;
function Probe() {
  latest = useCategories('nl');
  return <div data-testid="count">{latest.loading ? 'loading' : latest.categories.length}</div>;
}

const categoryCalls = (supabase) =>
  supabase.from.mock.calls.filter(([table]) => table === 'categories').length;

describe('useCategories forced reloads', () => {
  it('refetches when data is already cached (realtime event and refetch)', async () => {
    const { supabase, __mocks__ } = require('../../supabaseClient');
    render(<Probe />);

    await waitFor(() => expect(screen.getByTestId('count').textContent).toBe('1'));
    expect(categoryCalls(supabase)).toBe(1);

    const realtimeHandlers = __mocks__.mockOn.mock.calls
      .filter(([, filter]) => filter?.table === 'categories')
      .map(([, , handler]) => handler);
    expect(realtimeHandlers.length).toBeGreaterThan(0);

    await act(async () => {
      realtimeHandlers[0]();
    });
    await waitFor(() => expect(categoryCalls(supabase)).toBe(2));

    await act(async () => {
      await latest.refetch();
    });
    expect(categoryCalls(supabase)).toBe(3);
  });
});
