import React from 'react';
import { render, screen } from '@testing-library/react';
import '../../i18n';
import { useTranslation } from 'react-i18next';

function TestPortalFooter() {
  const { t } = useTranslation();
  return (
    <>
      <div>{t('adminLogin.portal')}</div>
      <div>{t('adminLogin.footerSecure')}</div>
    </>
  );
}

test('shows dutch portal label and footer in Dutch', () => {
  const i18n = require('../../i18n').default;
  i18n.changeLanguage('nl');

  render(<TestPortalFooter />);

  expect(screen.getByText('Portaal voor managers')).toBeInTheDocument();
  expect(screen.getByText('Alleen beveiligde toegang voor managers')).toBeInTheDocument();
});
