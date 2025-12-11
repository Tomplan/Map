import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

// Mock supabase client used by the context
jest.mock('../../supabaseClient', () => ({
  supabase: {
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
});
