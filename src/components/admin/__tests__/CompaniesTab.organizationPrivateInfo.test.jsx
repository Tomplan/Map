import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Mock i18n so tab labels are stable
jest.mock('react-i18next', () => ({
  useTranslation: () => {
    const map = {
      'companies.publicInfoTab': 'Public Info',
      'companies.privateInfoTab': 'Private Info',
      'companies.table.contact': 'Contact',
      'companies.table.phone': 'Phone',
      'companies.table.email': 'Email',
      'companies.table.address': 'Address',
      'companies.table.vatNumber': 'VAT number',
      'companies.table.kvkNumber': 'KvK number',
      'companies.privateDetailsLabel': 'Private details',
      'companies.detailsModalTitle': 'Private details for {{name}}',
    };
    return {
      t: (k, opts) => map[k] || (typeof opts === 'string' ? opts : opts?.defaultValue) || k,
      i18n: {
        language: 'en',
        exists: (k) => Object.prototype.hasOwnProperty.call(map, k),
      },
    };
  },
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
    address_line1: '123 Main St',
    city: 'Amsterdam',
    postal_code: '1000 AA',
    country: 'NL',
    vat_number: 'NL123456789B01',
    kvk_number: '12345678',
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
const mockGetCompanyCategories = async () => [];
const mockGetAllCompanyCategories = async () => ({});
const mockAssignCategories = jest.fn();

jest.mock('../../../hooks/useCategories', () => () => ({
  categories: [],
  getCompanyCategories: mockGetCompanyCategories,
  getAllCompanyCategories: mockGetAllCompanyCategories,
  assignCategoriesToCompany: mockAssignCategories,
}));
jest.mock('../../../contexts/OrganizationLogoContext', () => ({
  useOrganizationLogo: () => ({ organizationLogo: '' }),
}));
jest.mock('../../../contexts/DialogContext', () => ({
  useDialog: () => ({ toastError: jest.fn(), confirm: async () => true }),
}));

import CompaniesTab from '../CompaniesTab';

test('clicking a company card selects it and shows private details in the detail panel', async () => {
  render(
    <MemoryRouter initialEntries={['/companies']}>
      <CompaniesTab />
    </MemoryRouter>,
  );

  // The left-panel list should contain the org card
  const orgCard = screen.getByRole('button', { name: /Org name/i });
  expect(orgCard).toBeInTheDocument();

  // Before selection the detail panel shows the empty-state prompt
  expect(screen.queryByText('Organization Contact')).not.toBeInTheDocument();

  // Click the card to select it
  await userEvent.click(orgCard);

  // Private details should now be visible in the detail panel
  expect(screen.getByText('Organization Contact')).toBeInTheDocument();

  // Email should be visible as a link
  expect(screen.getByText('org@example.com')).toBeInTheDocument();

  // Phone displays with country code
  expect(screen.getByText(/\+31/)).toBeInTheDocument();

  // KvK number should be visible
  expect(screen.getByText('12345678')).toBeInTheDocument();

  // Address should be visible in the detail panel
  expect(screen.getByText(/Main St/)).toBeInTheDocument();
});

// New regression test for billing duplication
test('billing contact section is hidden when it duplicates main contact info', async () => {
  // override companies hook for this scenario
  const dupCo = {
    id: 2,
    name: 'DupCo',
    contact: 'Same Person',
    phone: '+311234567',
    email: 'same@example.com',
    contact_name: 'Same Person',
    contact_email: 'same@example.com',
    contact_phone: '+311234567',
  };
  const useCompanies = require('../../../hooks/useCompanies');
  useCompanies.mockReturnValue({
    companies: [dupCo],
    loading: false,
    error: null,
    createCompany: jest.fn(),
    updateCompany: jest.fn(),
    deleteCompany: jest.fn(),
    searchCompanies: jest.fn(),
    reload: jest.fn(),
  });

  render(
    <MemoryRouter initialEntries={['/companies']}>
      <CompaniesTab />
    </MemoryRouter>,
  );

  const card = await screen.findByRole('button', { name: /DupCo/i });
  await userEvent.click(card);

  // basic fields should still render
  expect(screen.getByText('Same Person')).toBeInTheDocument();
  expect(screen.getByText('same@example.com')).toBeInTheDocument();

  // billing contact heading should NOT appear because values duplicate
  expect(screen.queryByText('Billing Contact')).not.toBeInTheDocument();
});
