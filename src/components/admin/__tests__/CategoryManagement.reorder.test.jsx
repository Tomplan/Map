import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import CategoryManagement from '../CategoryManagement';
import { DialogProvider } from '../../../contexts/DialogContext';
// Using global jest for mocks

// Mock hooks and supabase
jest.mock('../../../hooks/useCategories', () => () => ({
  categories: [
    {
      id: '11111111-1111-1111-1111-111111111111',
      name: 'A',
      slug: 'a',
      icon: 'mdiDotsHorizontal',
      color: '#000',
      sort_order: 1,
      translations: [],
    },
    {
      id: '22222222-2222-2222-2222-222222222222',
      name: 'B',
      slug: 'b',
      icon: 'mdiDotsHorizontal',
      color: '#111',
      sort_order: 2,
      translations: [],
    },
    {
      id: '33333333-3333-3333-3333-333333333333',
      name: 'C',
      slug: 'c',
      icon: 'mdiDotsHorizontal',
      color: '#222',
      sort_order: 3,
      translations: [],
    },
  ],
  loading: false,
  error: null,
  createCategory: jest.fn(),
  updateCategory: jest.fn(),
  deleteCategory: jest.fn(),
  getCategoryStats: jest.fn(async () => ({})),
  refetch: jest.fn(),
}));

import { supabase } from '../../../supabaseClient';

describe('CategoryManagement DnD', () => {
  it('calls RPC with updated order when dropping', async () => {
    const oldRpc = supabase.rpc;
    const rpcSpy = jest.fn().mockResolvedValue({ data: null, error: null });
    supabase.rpc = rpcSpy;

    const { getByTestId } = render(<CategoryManagement />, {
      wrapper: ({ children }) => <DialogProvider>{children}</DialogProvider>,
    });

    const row0 = getByTestId('category-row-0');
    const row1 = getByTestId('category-row-1');

    // Simulate drag from row0 to row1
    fireEvent.dragStart(row0);
    // drag over row1
    fireEvent.dragOver(row1);
    // drop
    fireEvent.drop(row1);

    await waitFor(() => expect(rpcSpy).toHaveBeenCalledTimes(1));

    const expected = [
      { id: '22222222-2222-2222-2222-222222222222', sort_order: 1 },
      { id: '11111111-1111-1111-1111-111111111111', sort_order: 2 },
      { id: '33333333-3333-3333-3333-333333333333', sort_order: 3 },
    ];

    // Validate the param passed to RPC was the updates array; supabase rpc is invoked with an object param
    const callArg = rpcSpy.mock.calls[0][1];
    expect(callArg.updates).toEqual(expected);

    // restore
    supabase.rpc = oldRpc;
  });
});
