import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';

// Mock supabase client used by the context
jest.mock('../../supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(() => Promise.resolve({ data: { session: { user: { id: 'admin' } } } })),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
    },
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
    channel: jest.fn(() => ({ on: () => ({ subscribe: () => ({}) }) })),
    removeChannel: jest.fn(),
  },
}));

// Avoid importing mapConfig (uses import.meta) — mock BRANDING_CONFIG for tests
jest.mock('../../config/mapConfig', () => ({
  BRANDING_CONFIG: {
    DEFAULT_LOGO: 'fallback.png',
    getDefaultLogoPath: () => '/mocked/default/logo.png',
  },
}));

// Mock the helpers so normalization behavior is deterministic
jest.mock('../../utils/getLogoPath', () => ({
  getLogoPath: (p) => `/mocked/logo/path/${p}`,
}));

jest.mock('../../utils/getDefaultLogo', () => ({
  getDefaultLogoPath: () => '/mocked/default/logo.png',
}));

import { OrganizationLogoProvider, useOrganizationLogo } from '../OrganizationLogoContext';
import { supabase } from '../../supabaseClient';

function Consumer() {
  const { organizationLogo, organizationLogoRaw, loading } = useOrganizationLogo();
  return (
    <div>
      <div data-testid="logo">{organizationLogo}</div>
      <div data-testid="raw">{organizationLogoRaw}</div>
      <div data-testid="loading">{loading ? '1' : '0'}</div>
    </div>
  );
}

describe('OrganizationLogoProvider', () => {
  beforeEach(() => {
    // only clear call history & mocks, keep implemented mock functions (e.g. channel)
    jest.clearAllMocks();
  });

  it('normalizes DB filename using getLogoPath when found', async () => {
    // arrange - supabase returns a raw filename
    supabase.from.mockReturnValueOnce({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: { logo: 'company.png' }, error: null }),
        }),
      }),
    });

    render(
      <OrganizationLogoProvider>
        <Consumer />
      </OrganizationLogoProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('0'));

    expect(screen.getByTestId('logo').textContent).toContain('/mocked/logo/path/company.png');
    expect(screen.getByTestId('raw').textContent).toBe('company.png');
  });

  it('falls back to default when DB returns empty', async () => {
    supabase.from.mockReturnValueOnce({
      select: () => ({
        eq: () => ({ single: () => Promise.resolve({ data: { logo: '' }, error: null }) }),
      }),
    });

    render(
      <OrganizationLogoProvider>
        <Consumer />
      </OrganizationLogoProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('0'));

    expect(screen.getByTestId('logo').textContent).toBe('/mocked/default/logo.png');
    expect(screen.getByTestId('raw').textContent).toBe('fallback.png');
  });

  it('falls back to default when supabase returns an error', async () => {
    supabase.from.mockReturnValueOnce({
      select: () => ({
        eq: () => ({ single: () => Promise.resolve({ data: null, error: new Error('boom') }) }),
      }),
    });

    render(
      <OrganizationLogoProvider>
        <Consumer />
      </OrganizationLogoProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('0'));

    expect(screen.getByTestId('logo').textContent).toBe('/mocked/default/logo.png');
    expect(screen.getByTestId('raw').textContent).toBe('fallback.png');
  });

  describe('realtime channel', () => {
    const mockLogoFetch = () =>
      supabase.from.mockReturnValueOnce({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: { logo: 'company.png' }, error: null }),
          }),
        }),
      });

    const renderProvider = async () => {
      const view = render(
        <OrganizationLogoProvider>
          <Consumer />
        </OrganizationLogoProvider>,
      );
      await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('0'));
      await act(async () => {
        await Promise.resolve();
      });
      return view;
    };

    it('does not open a realtime channel for anonymous visitors', async () => {
      mockLogoFetch();
      supabase.auth.getSession.mockResolvedValueOnce({ data: { session: null } });

      await renderProvider();

      expect(supabase.channel).not.toHaveBeenCalled();
      expect(screen.getByTestId('raw').textContent).toBe('company.png');
    });

    it('opens the channel for a logged-in user and removes it on unmount', async () => {
      mockLogoFetch();

      const { unmount } = await renderProvider();

      expect(supabase.channel).toHaveBeenCalledWith('organization-logo-sync');

      unmount();
      expect(supabase.removeChannel).toHaveBeenCalledTimes(1);
    });

    it('opens the channel when a user logs in after the app has loaded', async () => {
      mockLogoFetch();
      supabase.auth.getSession.mockResolvedValueOnce({ data: { session: null } });
      let authCallback;
      supabase.auth.onAuthStateChange.mockImplementationOnce((cb) => {
        authCallback = cb;
        return { data: { subscription: { unsubscribe: jest.fn() } } };
      });

      await renderProvider();
      expect(supabase.channel).not.toHaveBeenCalled();

      act(() => {
        authCallback('SIGNED_IN', { user: { id: 'admin' } });
      });

      expect(supabase.channel).toHaveBeenCalledWith('organization-logo-sync');
    });
  });
});
