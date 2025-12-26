import React, { useEffect } from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';

// Mock supabase client used in the hook
jest.mock('../../supabaseClient', () => ({
  supabase: {
    from: jest.fn(() => ({ upsert: jest.fn().mockResolvedValue({ error: null }) })),
  },
}));

import { useCompanyMutations } from '../useCompanyMutations';

function TestCreateComponent({ createCompanyMock }) {
  const {
    isCreating,
    newCompanyForm,
    setNewCompanyForm,
    handleStartCreate,
    handleCreate,
  } = useCompanyMutations({
    createCompany: createCompanyMock,
    updateCompany: jest.fn(),
    deleteCompany: jest.fn(),
    updateProfile: jest.fn(),
    organizationLogo: '',
    confirm: jest.fn(),
    toastError: jest.fn(),
  });

  useEffect(() => {
    // Start create and set translations
    handleStartCreate();
    setNewCompanyForm({ name: 'NewCo', logo: '', website: '', info: '', translations: { nl: 'NL info', en: 'EN info' } });
  }, []);

  return (
    <div>
      <button onClick={handleCreate}>Create</button>
      <div data-testid="translations">{JSON.stringify(newCompanyForm.translations || {})}</div>
    </div>
  );
}

describe('useCompanyMutations create translations persistence', () => {
  test('calls createCompany and upserts translations to company_translations', async () => {
    const createCompanyMock = jest.fn().mockResolvedValue({ data: { id: 555 }, error: null });
    render(<TestCreateComponent createCompanyMock={createCompanyMock} />);

    // Wait for translations to be applied into form state
    await waitFor(() => expect(screen.getByTestId('translations')).toHaveTextContent('NL info'));

    // Click create
    fireEvent.click(screen.getByText('Create'));

    const createResult = await createCompanyMock.mock.results[0].value;
    expect(createResult).toBeDefined();
    expect(createResult.data).toBeDefined();
    expect(createResult.data.id).toBe(555);

    // Verify supabase upsert was called with expected rows
    const { supabase } = require('../../supabaseClient');
    expect(supabase.from).toHaveBeenCalledWith('company_translations');
    // The upsert function is on the object returned by the first call to supabase.from
    const upsertMock = supabase.from.mock.results[0].value.upsert;
    expect(upsertMock).toHaveBeenCalled();
    const upsertArg = upsertMock.mock.calls[0][0];
    // Expect rows for nl and en
    const langs = upsertArg.map((r) => r.language_code).sort();
    expect(langs).toEqual(['en', 'nl']);
    expect(upsertArg[0]).toHaveProperty('company_id', 555);
  });
});
