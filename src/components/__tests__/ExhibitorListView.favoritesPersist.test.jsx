import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

// Lightweight mocks used across the repo
jest.mock('../../hooks/useCategories', () => () => ({ categories: [], loading: false, getAllCompanyCategories: async () => ({}) }));
jest.mock('../../contexts/OrganizationLogoContext', () => ({ useOrganizationLogo: () => ({ organizationLogo: null }) }));
jest.mock('../../hooks/useTranslatedCompanyInfo', () => ({ getTranslatedInfo: (m) => m }));

// Favorities context - return a single favorite (companyId 100)
jest.mock('../../contexts/FavoritesContext', () => ({
  useFavoritesContext: () => ({
    favorites: [100],
    isFavorite: (id) => id === 100,
    toggleFavorite: jest.fn(),
  }),
}));

// Keep translation simple - return key
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k) => k, i18n: { language: 'en' } }) }));

// Avoid pulling in full react-router which expects browser globals in tests
jest.mock('react-router-dom', () => ({ useNavigate: () => jest.fn() }));
jest.mock('../../utils/getDefaultLogo', () => ({ getLogoWithFallback: (logo, org) => logo || org || '/assets/default-logo.png' }));

import ExhibitorListView from '../ExhibitorListView';

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe('ExhibitorListView — favorites-only persistence', () => {
  const selectedYear = 2025;

  const markersState = [
    // Favorited company (companyId 100)
    { id: 1, companyId: 100, name: 'Fav Co', glyph: 'A1' },
    { id: 2, companyId: 100, name: 'Fav Co', glyph: 'B2' },
    // Non-favorite company (companyId 101)
    { id: 3, companyId: 101, name: 'Other Co', glyph: 'C3' },
  ];

  it('honors stored favorites-only value on mount and persists toggles', async () => {
    // Step 1: Simulate user previously enabled favorites-only for this year
    localStorage.setItem(`exhibitors_showFavoritesOnly_${selectedYear}`, 'true');

    const { unmount } = render(<ExhibitorListView markersState={markersState} selectedYear={selectedYear} />);

    // Only the favorited company should be visible (grouped by companyId)
    // Wait for the async categories load / state updates to settle
    await screen.findByText('Fav Co');
    expect(screen.queryByText('Fav Co')).toBeTruthy();
    // Other Co should not be present
    expect(screen.queryByText('Other Co')).toBeNull();

    // Click the Favorites Only toggle to turn it off
    const toggleBtn = screen.getByText('exhibitorPage.favoritesOnly');
    fireEvent.click(toggleBtn);

    // localStorage should reflect the new value
    expect(localStorage.getItem(`exhibitors_showFavoritesOnly_${selectedYear}`)).toBe('false');

    // Now both companies should be shown (the non-favorite should appear)
    expect(screen.queryByText('Fav Co')).toBeTruthy();
    await screen.findByText('Other Co');
    expect(screen.queryByText('Other Co')).toBeTruthy();

    // Unmount and remount - persisted value should be read (false)
    unmount();
    render(<ExhibitorListView markersState={markersState} selectedYear={selectedYear} />);
    expect(localStorage.getItem(`exhibitors_showFavoritesOnly_${selectedYear}`)).toBe('false');
    // After remount we should see Other Co again
    await screen.findByText('Other Co');
    expect(screen.queryByText('Other Co')).toBeTruthy();
  });
});
