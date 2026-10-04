import React from 'react';
import { act, render, screen } from '@testing-library/react';

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
    div: ({ children, ...props }) => {
      const motionProps = new Set([
        'initial',
        'animate',
        'exit',
        'transition',
        'drag',
        'dragConstraints',
        'dragElastic',
        'onDragEnd',
      ]);
      const domProps = Object.fromEntries(
        Object.entries(props).filter(([key]) => !motionProps.has(key)),
      );

      return <div {...domProps}>{children}</div>;
    },
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

jest.mock('../../hooks/useCategories', () => {
  const getCompanyCategories = async () => [];
  const categories = [];

  return {
    useCategories: () => ({ getCompanyCategories, categories }),
  };
});

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
  it('renders translated company info instead of the deprecated raw info field', async () => {
    await act(async () => {
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
      await Promise.resolve();
    });

    expect(screen.getByText('Translated DefenderShop text')).toBeInTheDocument();
    expect(screen.queryByText('Legacy DefenderShop text')).not.toBeInTheDocument();

    const boothLabel = screen.getByText('Booth A1');
    const boothRow = boothLabel.closest('div');
    expect(boothRow).toHaveClass('text-orange-600');
    expect(boothRow.querySelector('svg')).toBeInTheDocument();
  });

  it('does not show a booth label for special markers', async () => {
    await act(async () => {
      render(
        <BottomSheet
          marker={{
            id: 1001,
            name: 'Parking',
            glyph: 'P1',
            info: 'Special marker info',
          }}
          onClose={() => {}}
        />,
      );
    });

    expect(screen.queryByText('Booth P1')).not.toBeInTheDocument();
    expect(screen.getByText('Parking')).toBeInTheDocument();
  });
});
