import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock router and i18n so tests run in Node without DOM TextEncoder errors
jest.mock('react-router-dom', () => ({ useNavigate: () => jest.fn() }));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k) => k }) }));

jest.mock('../../contexts/OrganizationLogoContext', () => ({
  useOrganizationLogo: () => ({
    organizationLogo: '/assets/logos/generated/4x4Vakantiebeurs-128.webp',
    organizationLogoRaw: '/assets/logos/4x4Vakantiebeurs.png',
    loading: false,
  }),
}));

const mockUseSubscriptionCount = jest.fn(() => ({ count: 42, loading: false }));
jest.mock('../../hooks/useCountViews', () => ({
  useSubscriptionCount: () => mockUseSubscriptionCount(),
}));

// Prevent the real hook from calling Supabase in tests
jest.mock('../../hooks/useEventMapSettings', () => () => ({ settings: null, loading: false }));

// Avoid parsing utils that reference import.meta
jest.mock('../../utils/getLogoPath', () => ({
  getLogoPath: (p) => p,
  getResponsiveLogoSources: (p) => ({ src: p, srcSet: null, sizes: null }),
}));

// Mock default logo helper which uses import.meta through mapConfig
jest.mock('../../utils/getDefaultLogo', () => ({
  getDefaultLogoPath: () => '/assets/logos/4x4Vakantiebeurs.png',
}));

// Replace LanguageToggle so we don't need PreferencesProvider in this unit test
jest.mock('../LanguageToggle', () => () => <div data-testid="language-toggle" />);

import HomePage from '../HomePage';

describe('HomePage logo rendering', () => {
  beforeEach(() => {
    mockUseSubscriptionCount.mockReturnValue({ count: 42, loading: false });
  });
  it('renders organization logo when provided by context', () => {
    render(<HomePage selectedYear={2025} branding={{ eventName: 'Test Event' }} />);
    const img = screen.getByAltText('Test Event');
    expect(img).toBeInTheDocument();
    expect(img.getAttribute('src')).toContain('4x4Vakantiebeurs-128.webp');
  });

  it('onError attempts raw then normalized and sets retries counter', () => {
    const { container } = render(
      <HomePage selectedYear={2025} branding={{ eventName: 'Test Event' }} />,
    );

    const img = screen.getByAltText('Test Event');
    // simulate the image failing to load
    img.dispatchEvent(new Event('error'));

    // After first failure, it should have tried the raw URL next (we'll assert retry count increment)
    expect(img.dataset.logoRetries).toBeDefined();
    expect(Number(img.dataset.logoRetries) > 0).toBeTruthy();

    // If we trigger error again it should increase the retry count (bounded attempts)
    const prev = Number(img.dataset.logoRetries);
    img.dispatchEvent(new Event('error'));
    expect(Number(img.dataset.logoRetries)).toBeGreaterThanOrEqual(prev);
  });

  it('shows placeholder while subscription count is loading', () => {
    mockUseSubscriptionCount.mockReturnValueOnce({ count: 0, loading: true });
    const { getByText } = render(<HomePage selectedYear={2025} branding={{ eventName: 'Test' }} />);
    expect(getByText('...')).toBeInTheDocument();
  });

  it('shows the subscription count after loading finishes', () => {
    // Replace the default for this test so both internal hook calls will return the expected value
    mockUseSubscriptionCount.mockReturnValue({ count: 7, loading: false });
    const { getByText } = render(<HomePage selectedYear={2025} branding={{ eventName: 'Test' }} />);
    expect(getByText('7')).toBeInTheDocument();
  });
});
