import React from 'react';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';

// Keep translations and helpers minimal
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k) => k, i18n: { language: 'en' } }),
}));
jest.mock('../../hooks/useCategories', () => () => ({
  categories: [],
  loading: false,
  getAllCompanyCategories: async () => ({}),
}));
jest.mock('../../contexts/OrganizationLogoContext', () => ({
  useOrganizationLogo: () => ({ organizationLogo: null }),
}));
jest.mock('../../hooks/useTranslatedCompanyInfo', () => ({ getTranslatedInfo: (m) => m }));
jest.mock('../../utils/getDefaultLogo', () => ({
  getLogoWithFallback: (logo, org) => logo || org || '/assets/default-logo.png',
}));

// Avoid pulling react-router during tests
jest.mock('react-router-dom', () => ({ useNavigate: () => jest.fn() }));

// Favorites context - start empty (no favorites)
jest.mock('../../contexts/FavoritesContext', () => ({
  useFavoritesContext: () => ({
    favorites: [],
    isFavorite: () => false,
    toggleFavorite: jest.fn(),
  }),
  useOptionalFavoritesContext: () => ({
    favorites: [],
    isFavorite: () => false,
    toggleFavorite: jest.fn(),
  }),
}));

import ExhibitorListView from '../ExhibitorListView';

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe('ExhibitorListView — clear persisted favorites-only when there are no favorites', () => {
  const selectedYear = 2025;

  const markersState = [
    { id: 1, companyId: 10, name: 'A', glyph: '10' },
    { id: 2, companyId: 11, name: 'B', glyph: '11' },
  ];

  it('reads a stored favorites-only = true but clears it when favorites are empty', async () => {
    // Simulate toggle enabled in another session/tab for this year
    localStorage.setItem(`exhibitors_showFavoritesOnly_${selectedYear}`, 'true');

    render(<ExhibitorListView markersState={markersState} selectedYear={selectedYear} />);

    // When there are no favorites, the component should reset the toggle to false
    expect(localStorage.getItem(`exhibitors_showFavoritesOnly_${selectedYear}`)).toBe('false');

    // Both exhibitors should be visible since toggle got reset
    expect(await screen.findByText('A')).toBeTruthy();
    expect(await screen.findByText('B')).toBeTruthy();
  });
});
