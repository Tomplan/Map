import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('react-router-dom', () => ({ useNavigate: () => jest.fn() }));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k) => k, i18n: { language: 'en-US' } }),
}));

jest.mock('../../contexts/OrganizationLogoContext', () => ({
  useOrganizationLogo: () => ({
    organizationLogo: '/assets/logos/generated/4x4Vakantiebeurs-128.webp',
    organizationLogoRaw: '/assets/logos/4x4Vakantiebeurs.png',
    loading: false,
  }),
}));

jest.mock('../../hooks/useCountViews', () => ({
  useSubscriptionCount: () => ({ count: 5, loading: false }),
}));

// By default, return no settings
const mockUseEventMap = jest.fn(() => ({ settings: null, loading: false }));
jest.mock('../../hooks/useEventMapSettings', () => (y) => mockUseEventMap(y));

// Avoid import.meta utilities
jest.mock('../../utils/getLogoPath', () => ({
  getLogoPath: (p) => p,
  getResponsiveLogoSources: (p) => ({ src: p, srcSet: null, sizes: null }),
}));
jest.mock('../../utils/getDefaultLogo', () => ({
  getDefaultLogoPath: () => '/assets/logos/4x4Vakantiebeurs.png',
}));
jest.mock('../LanguageToggle', () => () => <div data-testid="language-toggle" />);

import HomePage from '../HomePage';

describe('HomePage date rendering', () => {
  it('uses DB-driven dates when present', () => {
    mockUseEventMap.mockReturnValue({
      settings: { event_start_date: '2026-10-10', event_end_date: '2026-10-11' },
      loading: false,
    });
    render(<HomePage selectedYear={2026} branding={{ eventName: 'Test' }} />);
    // The formatted DB-driven dates should replace the translation fallback
    expect(screen.getByText(/October/)).toBeInTheDocument();
    // days should be computed from start/end -> 10-10 to 10-11 is 2 days
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('falls back to translation when no DB dates present', () => {
    mockUseEventMap.mockReturnValue({ settings: null, loading: false });
    render(<HomePage selectedYear={2026} branding={{ eventName: 'Test' }} />);
    expect(screen.getByText('homePage.eventDate')).toBeInTheDocument();
  });
});
