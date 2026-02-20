import React from 'react';
import { render, screen } from '@testing-library/react';
import '../../i18n';
import { useTranslation } from 'react-i18next';

function TestBranding() {
  const { t } = useTranslation();
  return <div>{t('branding.eventName')}</div>;
}

test('shows translated event name in Dutch when language is nl', () => {
  const __i18n = require('../../i18n').default;
  __i18n.changeLanguage('nl');

  render(<TestBranding />);

  expect(screen.getByText(__i18n.t('homePage.title'))).toBeInTheDocument();
});
