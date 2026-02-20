import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

jest.mock('../../supabaseClient', () => {
  const mockSingle = jest.fn().mockResolvedValue({ data: { id: 1, name: 'Org' }, error: null });
  const mockSelect = jest.fn(() => ({ single: mockSingle }));
  const mockFrom = jest.fn(() => ({ select: mockSelect }));
  const mockOn = jest.fn().mockReturnThis();
  const mockSubscribe = jest.fn(() => ({ id: 'ch-org' }));
  const mockChannel = jest.fn(() => ({ on: mockOn, subscribe: mockSubscribe }));
  const mockRemoveChannel = jest.fn();

  return {
    supabase: {
      from: mockFrom,
      channel: mockChannel,
      removeChannel: mockRemoveChannel,
    },
    __mocks__: { mockFrom, mockSelect, mockSingle, mockChannel, mockSubscribe, mockRemoveChannel, mockOn },
  };
});

import useOrganizationProfile from '../useOrganizationProfile';

function Probe({ id }) {
  const { profile, loading } = useOrganizationProfile();
  if (loading) return <div data-testid={`p-${id}`}>loading</div>;
  return <div data-testid={`p-${id}`}>{JSON.stringify(profile)}</div>;
}

describe('useOrganizationProfile caching', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shares single REST request and realtime channel across consumers', async () => {
    render(
      <div>
        <Probe id="a" />
        <Probe id="b" />
      </div>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('p-a').textContent).toMatch(/Org/);
      expect(screen.getByTestId('p-b').textContent).toMatch(/Org/);
    });

    const { supabase } = require('../../supabaseClient');
    expect(supabase.from).toHaveBeenCalledTimes(1);
    expect(supabase.from).toHaveBeenCalledWith('organization_profile');
    expect(supabase.channel).toHaveBeenCalledTimes(1);
    expect(String(supabase.channel.mock.calls[0][0])).toMatch(/organization-profile/);
  });
});
