import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

jest.mock('react-leaflet', () => ({
  Tooltip: ({ children }) =>
    require('react').createElement('div', { 'data-testid': 'tooltip' }, children),
  Popup: ({ children }) =>
    require('react').createElement('div', { 'data-testid': 'popup' }, children),
}));

jest.mock('../MobileBottomSheet', () => () => null);
jest.mock('../FavoriteButton', () => () => null);
jest.mock('../../utils/getDefaultLogo', () => ({
  getLogoWithFallback: (logo, org) => logo || org || '/assets/default-logo.png',
}));
jest.mock('../../hooks/useIsMobile', () => () => false);
jest.mock('../../contexts/OrganizationLogoContext', () => ({
  useOrganizationLogo: () => ({ organizationLogo: null, loading: false }),
}));
jest.mock('../../hooks/useTranslatedCompanyInfo', () => ({
  useTranslatedCompanyInfo: () => 'Some translated info',
}));
const mockGetCompanyCategories = async () => [];
jest.mock('../../hooks/useCategories', () => ({
  useCategories: () => ({ getCompanyCategories: mockGetCompanyCategories }),
}));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ i18n: { language: 'en' } }) }));
jest.mock('../../contexts/FavoritesContext', () => ({
  useFavoritesContext: () => ({ isFavorite: () => false, toggleFavorite: () => {} }),
  useOptionalFavoritesContext: () => ({ isFavorite: () => false, toggleFavorite: () => {} }),
}));

import { MarkerUI } from '../MarkerDetailsUI';

describe('MarkerDetailsUI — showBoothNumber', () => {
  const baseMarker = {
    id: 1001,
    name: 'Test Co',
    glyph: 'B12',
    logo: '/assets/test.png',
    companyId: 9001,
  };

  it('does not show Booth text when showBoothNumber is false', async () => {
    render(
      <MarkerUI
        marker={baseMarker}
        isMobile={false}
        organizationLogo={null}
        showBoothNumber={false}
      />,
    );

    // Tooltip + popup should render, but not include 'Booth'
    const tooltip = screen.getByTestId('tooltip');
    const popup = screen.getByTestId('popup');

    await waitFor(() => expect(tooltip).toBeTruthy());
    await waitFor(() => expect(popup).toBeTruthy());
    expect(tooltip.textContent).not.toMatch(/Booth/);
    expect(popup.textContent).not.toMatch(/Booth/);
  });

  it('does show Booth text when showBoothNumber is true', async () => {
    render(
      <MarkerUI
        marker={baseMarker}
        isMobile={false}
        organizationLogo={null}
        showBoothNumber={true}
      />,
    );

    const tooltip = screen.getByTestId('tooltip');
    const popup = screen.getByTestId('popup');

    await waitFor(() => expect(tooltip).toBeTruthy());
    await waitFor(() => expect(popup).toBeTruthy());
    expect(tooltip.textContent).toMatch(/Booth/);
    expect(popup.textContent).toMatch(/Booth/);
  });
});
