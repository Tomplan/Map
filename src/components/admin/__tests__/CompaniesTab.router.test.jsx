import React, { useEffect } from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useNavigate } from 'react-router-dom';

// stub out utilities that reference import.meta or browser APIs
jest.mock('../../../utils/getLogoPath', () => ({
  getLogoPath: () => '',
  getResponsiveLogoSources: () => [],
}));
jest.mock('../../../utils/getDefaultLogo', () => ({ getDefaultLogoPath: () => '' }));

// replicate mocks from CompaniesTab.organizationPrivateInfo.test
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (k, opts) => {
      const map = {
        'companies.publicInfoTab': 'Public Info',
        'companies.privateInfoTab': 'Private Info',
      };
      return map[k] || (typeof opts === 'string' ? opts : opts?.defaultValue) || k;
    },
    i18n: { language: 'en' },
  }),
}));

jest.mock('../../../utils/getLogoPath', () => ({
  getLogoPath: () => '',
  getResponsiveLogoSources: () => [],
}));
jest.mock('../../../utils/getDefaultLogo', () => ({ getDefaultLogoPath: () => '' }));

jest.mock('../../../hooks/useCompanies', () => {
  const actual = jest.requireActual('../../../hooks/useCompanies');
  return actual;
});

jest.mock('../../../hooks/useOrganizationProfile', () => () => ({
  profile: { id: 1, name: 'Org', contact: 'Org Contact', phone: '', email: '' },
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

// reuse existing supabase mock from other tests
jest.mock('../../../supabaseClient', () => {
  // simulate a single company returned from the API so we can assert on it
  const sampleCompanies = [{ id: 1, name: 'TestCo', logo: '', website: '', info: '' }];
  const mockSelect = jest.fn(() => ({
    order: jest.fn(() => Promise.resolve({ data: sampleCompanies, error: null })),
  }));
  const mockFrom = jest.fn(() => ({ select: mockSelect }));
  const mockOn = jest.fn().mockReturnThis();
  const mockSubscribe = jest.fn(() => ({ id: 'ch-comp' }));
  const mockChannel = jest.fn(() => ({ on: mockOn, subscribe: mockSubscribe }));
  const mockRemoveChannel = jest.fn();

  return {
    supabase: {
      from: mockFrom,
      channel: mockChannel,
      removeChannel: mockRemoveChannel,
    },
    __mocks__: { mockFrom, mockSelect, mockChannel, mockSubscribe, mockRemoveChannel, mockOn },
  };
});

import CompaniesTab from '../CompaniesTab';

function renderWithRouter(initial, navRef) {
  // navRef is a ref object that will receive the navigate function
  function NavSetter({ children }) {
    const navigate = useNavigate();
    useEffect(() => {
      if (navRef) navRef.current = navigate;
    }, [navigate]);
    return children;
  }

  return render(
    <MemoryRouter initialEntries={[initial]}>
      <NavSetter>
        <Routes>
          <Route path="/companies" element={<CompaniesTab />} />
          <Route path="/dashboard" element={<div data-testid="dash">dash</div>} />
        </Routes>
      </NavSetter>
    </MemoryRouter>,
  );
}

describe('CompaniesTab routing', () => {
  beforeEach(() => jest.clearAllMocks());

  it('mounts and reloads when navigating away and back', async () => {
    const navRef = { current: null };
    renderWithRouter('/companies', navRef);
    await waitFor(() => expect(screen.getByTitle('Export Companies')).toBeInTheDocument());

    // navigate away
    act(() => {
      navRef.current('/dashboard');
    });
    await waitFor(() => expect(screen.getByTestId('dash')).toBeInTheDocument());

    // navigate back
    act(() => {
      navRef.current('/companies');
    });
    await waitFor(() => expect(screen.getByTitle('Export Companies')).toBeInTheDocument());

    const { supabase } = require('../../../supabaseClient');
    // since we only fetch when the cache is empty, the API should be called once
    expect(supabase.from.mock.calls.length).toBe(1);
    // our mock returns one company; ensure it was rendered
    expect(screen.getByText('TestCo')).toBeInTheDocument();
    // ensure loading message never appeared during second visit
    expect(screen.queryByText('companies.loadingData')).toBeNull();
  });
});
