import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('react-leaflet', () => ({
  useMap: () => ({
    dragging: {
      disable: jest.fn(),
      enable: jest.fn(),
    },
  }),
}));

jest.mock('framer-motion', () => ({
  AnimatePresence: ({ children }) => <>{children}</>,
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
}));

jest.mock('../../contexts/OrganizationLogoContext', () => ({
  useOrganizationLogo: () => ({ organizationLogo: null, loading: false }),
}));

jest.mock('../../contexts/FavoritesContext', () => ({
  useOptionalFavoritesContext: () => ({ isFavorite: () => false, toggleFavorite: () => {} }),
}));

jest.mock('../../utils/getDefaultLogo', () => ({
  getLogoWithFallback: (logo, org) => logo || org || '/assets/default-logo.png',
}));

jest.mock('../../hooks/useCategories', () => ({
  useCategories: () => ({ getCompanyCategories: async () => [], categories: [] }),
}));

jest.mock('../../hooks/useTranslatedCompanyInfo', () => ({
  useTranslatedCompanyInfo: () => 'Translated DefenderShop text',
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, fallback) => fallback || key,
    i18n: { language: 'en' },
  }),
}));

jest.mock('../FavoriteButton', () => () => null);

import BottomSheet from '../MobileBottomSheet';

describe('MobileBottomSheet translated info', () => {
  it('renders translated company info instead of the deprecated raw info field', () => {
    render(
      <BottomSheet
        marker={{
          id: 12,
          name: 'DefenderShop',
          glyph: 'A1',
          companyId: 5,
          info: 'Legacy DefenderShop text',
          website: 'https://defendershop.com',
        }}
        onClose={() => {}}
      />,
    );

    expect(screen.getByText('Translated DefenderShop text')).toBeInTheDocument();
    expect(screen.queryByText('Legacy DefenderShop text')).not.toBeInTheDocument();
  });
});