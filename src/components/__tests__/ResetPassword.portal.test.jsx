import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => (key === 'adminLogin.portal' ? 'Portaal voor managers' : key),
    i18n: { language: 'nl', changeLanguage: jest.fn() },
  }),
}));

jest.mock('react-router-dom', () => ({ useNavigate: () => jest.fn() }));

jest.mock('../../supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(() => Promise.resolve({ data: { session: null } })),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
      updateUser: jest.fn(),
    },
  },
}));

jest.mock('../LanguageToggle', () => ({ __esModule: true, default: () => null }));

import ResetPassword from '../ResetPassword';

describe('ResetPassword', () => {
  it('shows the translated manager portal label instead of hardcoded English', async () => {
    render(<ResetPassword branding={{ eventName: 'Test' }} />);
    expect(await screen.findByText('Portaal voor managers')).toBeInTheDocument();
    expect(screen.queryByText('Manager Portal')).not.toBeInTheDocument();
    // let the token check settle so no state update happens outside act
    await screen.findByText('resetPassword.errors.invalidToken', {}, { timeout: 3000 });
  });
});
