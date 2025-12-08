import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Provide a Dutch translation mapping for keys we want to assert
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (k, opts) => {
      const map = {
          'companies.publicInfoTab': 'Publiek',
          'companies.privateInfoTab': 'Alleen managers',
          'companies.modal.publicInfoHeading': 'Publieke info (zichtbaar voor deelnemers)',
          'companies.create': 'Aanmaken',
          'companies.loadingData': 'Gegevens laden...',
          'companies.errorWithMessage': 'Fout: {{message}}'
        };
      return map[k] || (typeof opts === 'string' ? opts : opts?.defaultValue) || k;
    },
    i18n: { language: 'nl' }
  })
}));

// Mock helpers that touch runtime-only APIs or import.meta
jest.mock('../../../utils/getLogoPath', () => ({ getLogoPath: (src) => src || '', getResponsiveLogoSources: () => null }));
jest.mock('../../../utils/getDefaultLogo', () => ({ getDefaultLogoPath: () => '/assets/default.png' }));

// Mock all hooks used by CompaniesTab so rendering is deterministic
jest.mock('../../../hooks/useCompanies', () => () => ({
  companies: [{ id: 1, name: 'Acme', logo: '', website: '', info: '' }],
  loading: false,
  error: null,
  createCompany: jest.fn(),
  updateCompany: jest.fn(),
  deleteCompany: jest.fn(),
  searchCompanies: jest.fn(),
  reload: jest.fn()
}));

jest.mock('../../../hooks/useOrganizationProfile', () => () => ({
  profile: { id: 1, name: 'Org' }, loading: false, error: null, updateProfile: jest.fn()
}));

jest.mock('../../../hooks/useCompanyMutations', () => ({
  useCompanyMutations: () => ({
  editingId: null,
  editForm: {},
  setEditForm: jest.fn(),
  isCreating: true,
  newCompanyForm: { name: 'NewCo' },
    setNewCompanyForm: jest.fn(),
    handleEdit: jest.fn(),
    handleSave: jest.fn(),
    handleCancel: jest.fn(),
    handleDelete: jest.fn(),
    handleCreate: jest.fn(),
    handleStartCreate: jest.fn(),
    handleCancelCreate: jest.fn(),
  })
}));

jest.mock('../../../hooks/useCompanyTranslations', () => () => ({ translations: {}, getTranslation: () => '' }));
jest.mock('../../../hooks/useCategories', () => () => ({ categories: [], getCompanyCategories: async () => [], getAllCompanyCategories: async (ids) => { const out = {}; ids.forEach(id => { out[id] = [] }); return out; }, assignCategoriesToCompany: jest.fn() }));
jest.mock('../../../contexts/OrganizationLogoContext', () => ({ useOrganizationLogo: () => ({ organizationLogo: '' }) }));
jest.mock('../../../contexts/DialogContext', () => ({ useDialog: () => ({ toastError: jest.fn(), confirm: async () => true }) }));
jest.mock('../../../supabaseClient');

import CompaniesTab from '../CompaniesTab';

test('renders companies tab labels in Dutch (i18n) and modal heading', async () => {
  render(<CompaniesTab />);

  // Tabs should show Dutch labels from mocked t()
  expect(await screen.findByText('Publiek')).toBeInTheDocument();
  expect(await screen.findByText('Alleen managers')).toBeInTheDocument();

  // Modal action should show the Dutch Create label when creating
  expect(await screen.findByText('Aanmaken')).toBeInTheDocument();
});
