import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Mock i18n so tab labels are stable
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (k, opts) => {
      const map = {
        'companies.publicInfoTab': 'Public Info',
        'companies.privateInfoTab': 'Private Info',
        'companies.table.contact': 'Contact',
        'companies.table.phone': 'Phone',
        'companies.table.email': 'Email',
      };
      return map[k] || (typeof opts === 'string' ? opts : opts?.defaultValue) || k;
    },
    i18n: { language: 'en' },
  }),
}));

jest.mock('../../../utils/getLogoPath', () => ({
  getLogoPath: (src) => src || '',
  getResponsiveLogoSources: () => null,
}));
jest.mock('../../../utils/getDefaultLogo', () => ({
  getDefaultLogoPath: () => '/assets/default.png',
}));

// Hooks used by CompaniesTab
jest.mock('../../../hooks/useCompanies', () => () => ({
  companies: [],
  loading: false,
  error: null,
  createCompany: jest.fn(),
  updateCompany: jest.fn(),
  deleteCompany: jest.fn(),
  searchCompanies: jest.fn(),
  reload: jest.fn(),
}));

jest.mock('../../../hooks/useOrganizationProfile', () => () => ({
  profile: {
    id: 1,
    name: 'Org name',
    contact: 'Organization Contact',
    phone: '+31201234567',
    email: 'org@example.com',
  },
  loading: false,
  error: null,
  updateProfile: jest.fn(),
}));

jest.mock('../../../hooks/useCompanyMutations', () => ({
  useCompanyMutations: () => ({
    editingId: null,
    editForm: {},
    setEditForm: jest.fn(),
    isCreating: false,
    newCompanyForm: {},
    setNewCompanyForm: jest.fn(),
    handleEdit: jest.fn(),
    handleSave: jest.fn(),
    handleCancel: jest.fn(),
    handleDelete: jest.fn(),
    handleCreate: jest.fn(),
    handleStartCreate: jest.fn(),
    handleCancelCreate: jest.fn(),
  }),
}));

jest.mock('../../../hooks/useCompanyTranslations', () => () => ({
  translations: {},
  getTranslation: () => '',
}));
jest.mock('../../../hooks/useCategories', () => () => ({
  categories: [],
  getCompanyCategories: async () => [],
  getAllCompanyCategories: async () => ({}),
  assignCategoriesToCompany: jest.fn(),
}));
jest.mock('../../../contexts/OrganizationLogoContext', () => ({
  useOrganizationLogo: () => ({ organizationLogo: '' }),
}));
jest.mock('../../../contexts/DialogContext', () => ({
  useDialog: () => ({ toastError: jest.fn(), confirm: async () => true }),
}));

import CompaniesTab from '../CompaniesTab';

test('organization row shows manager-only (private) contact/phone/email in Manager tab', async () => {
  render(<CompaniesTab />);

  // Switch to Manager/Private Info tab
  await userEvent.click(screen.getByText('Private Info'));

  // Organization contact should be visible in the first row
  expect(screen.getByText('Organization Contact')).toBeInTheDocument();

  // Email should be visible
  expect(screen.getByText('org@example.com')).toBeInTheDocument();

  // Phone is formatted and displayed as text (we check country code)
  expect(screen.getByText(/\+31/)).toBeInTheDocument();
});
