import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';

jest.mock('../../supabaseClient', () => {
  const mockSelect = jest.fn(() => ({
    order: jest.fn(() => Promise.resolve({ data: [], error: null })),
  }));
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
  beforeEach(() => {
    jest.clearAllMocks();
    // reset the singleton cache so each test starts fresh
    const { default: useCompanies } = require('../useCompanies');
    useCompanies.cache = null;
  });

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

  it('re-fetches when component unmounts and remounts', async () => {
    const { supabase } = require('../../supabaseClient');

    // initial render
    const { unmount } = render(<Probe id="x" />);
    await waitFor(() => expect(screen.getByTestId('p-x').textContent).not.toMatch(/loading/));
    expect(supabase.from).toHaveBeenCalledTimes(1);

    // unmount the probe (refCount drops to 0, cache entry persisted)
    unmount();

    // render again
    render(<Probe id="y" />);
    await waitFor(() => expect(screen.getByTestId('p-y').textContent).not.toMatch(/loading/));

    // the hook should initiate a second fetch on new mount
    expect(supabase.from).toHaveBeenCalledTimes(2);
  });

  it('does not clear entry when unmounted mid-fetch and reuses result', async () => {
    const { supabase } = require('../../supabaseClient');

    // make the select promise controllable
    let resolveFetch;
    const fetchPromise = new Promise((res) => {
      resolveFetch = res;
    });
    // mimic the normal chain .from(...).select(...).order(...)
    supabase.from.mockImplementation(() => ({
      select: () => ({ order: () => fetchPromise }),
    }));

    // render and start load
    const { unmount } = render(<Probe id="u" />);
    // should show loading state once the effect kicks in
    await waitFor(() => expect(screen.getByTestId('p-u').textContent).toMatch(/loading/));

    // unmount before the fetch resolves
    unmount();

    // now complete the fetch with some data
    act(() => resolveFetch({ data: [{ id: 1, name: 'Acme' }], error: null }));
    await act(() => fetchPromise);

    // mount again; if cache was preserved we should not see loading and
    // the fetch should not be called a second time
    render(<Probe id="v" />);
    await waitFor(() => {
      expect(screen.getByTestId('p-v').textContent).not.toMatch(/loading/);
    });
    expect(supabase.from).toHaveBeenCalledTimes(1);
  });
});
