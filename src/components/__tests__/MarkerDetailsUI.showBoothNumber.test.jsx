import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

jest.mock('react-leaflet', () => ({
  Tooltip: ({ children }) =>
    require('react').createElement('div', { 'data-testid': 'tooltip' }, children),
  Popup: ({ children }) =>
    require('react').createElement('div', { 'data-testid': 'popup' }, children),
}));

jest.mock('../MobileBottomSheet', () => ({
  __esModule: true,
  default: () => null,
  BottomSheetContent: ({ marker }) =>
    require('react').createElement('div', { 'data-testid': 'bottom-sheet-content' }, marker.name),
}));
jest.mock('../FavoriteButton', () => () => null);
jest.mock('../../utils/getDefaultLogo', () => ({
  getLogoWithFallback: (logo, org) => logo || org || '/assets/default-logo.png',
}));
jest.mock('../../hooks/useIsMobile', () => () => false);
jest.mock('../../contexts/OrganizationLogoContext', () => ({
  useOrganizationLogo: () => ({ organizationLogo: null, loading: false }),
}));
jest.mock('../../hooks/useTranslatedCompanyInfo', () => ({
  getSpecialMarkerText: (marker, field, language) =>
    marker?.[`${field}_${language}`] || marker?.[field] || '',
  useTranslatedCompanyInfo: () => 'Some translated info',
}));
const mockGetCompanyCategories = async () => [];
jest.mock('../../hooks/useCategories', () => ({
  useCategories: () => ({ getCompanyCategories: mockGetCompanyCategories }),
}));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k, d) => d || k, i18n: { language: 'en' } }),
}));
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
    website: 'https://test.example',
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

  it('shows the English title for a translated special marker', () => {
    const translatedMarker = {
      ...baseMarker,
      name: 'Parkeerplaats',
      name_en: 'Parking area',
    };

    render(
      <MarkerUI marker={translatedMarker} isMobile={false} organizationLogo={null} />,
    );

    expect(screen.getAllByText('Parking area').length).toBeGreaterThan(0);
    expect(screen.queryByText('Parkeerplaats')).not.toBeInTheDocument();
  });

  it('uses bottom-sheet content in the admin popup while keeping the app preview on hover', () => {
    render(
      <MarkerUI marker={baseMarker} isMobile={false} isAdminView={true} organizationLogo={null} />,
    );

    expect(screen.getByTestId('tooltip').textContent).toMatch(/test\.example/);
    expect(
      screen.getByTestId('popup').querySelector('[data-testid="bottom-sheet-content"]'),
    ).not.toBeNull();
  });

  it('keeps the mobile admin popup linked to the actual bottom sheet', () => {
    const onMoreInfo = jest.fn();

    render(
      <MarkerUI
        marker={baseMarker}
        isMobile={true}
        isAdminView={true}
        organizationLogo={null}
        onMoreInfo={onMoreInfo}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'More Info' }));

    expect(onMoreInfo).toHaveBeenCalled();
    expect(
      screen.getByTestId('popup').querySelector('[data-testid="bottom-sheet-content"]'),
    ).toBeNull();
  });
});
