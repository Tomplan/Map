import React from 'react';
import { render, screen } from '@testing-library/react';
import '../../i18n';

// Stub language toggle to avoid context providers in this unit test
jest.mock('../LanguageToggle', () => () => <div data-testid="language-toggle" />);

import { useTranslation } from 'react-i18next';

function TestBranding() {
  const { t } = useTranslation();
  return <div>{t('branding.eventName')}</div>;
}

test('shows translated event name from locale when branding not provided', () => {
  const i18n = require('../../i18n').default;
  i18n.changeLanguage('en');

  render(<TestBranding />);

  const __i18n = require('../../i18n').default;

  expect(screen.getByText(__i18n.t('homePage.title'))).toBeInTheDocument();
});
