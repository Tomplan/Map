import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';

jest.mock('../../supabaseClient', () => {
  // simplified chainable mock helpers
  const mockEq = jest.fn(() => Promise.resolve({ data: [], error: null }));
  const mockSelect = jest.fn(() => ({ eq: mockEq }));
  const mockUpsert = jest.fn(() => Promise.resolve({ error: null }));
  // delete chain must support two successive eq() calls and return a final promise
  const mockDelete = jest.fn(() => ({
    eq: jest.fn(() => ({
      eq: jest.fn(() => Promise.resolve({ error: null })),
    })),
  }));

  const mockFrom = jest.fn(() => ({
    select: mockSelect,
    eq: mockSelect,
    upsert: mockUpsert,
    delete: mockDelete,
  }));

  return {
    supabase: {
      from: mockFrom,
    },
    __mocks__: { mockFrom, mockSelect, mockEq, mockUpsert, mockDelete },
  };
});

import useCompanyTranslations from '../useCompanyTranslations';

function Probe({ companyId }) {
  const { translations, loading } = useCompanyTranslations(companyId);
  return <div data-testid="probe">{loading ? 'loading' : JSON.stringify(translations)}</div>;
}

describe('useCompanyTranslations cache/dedupe', () => {
  beforeEach(() => jest.clearAllMocks());

  it('loads once per company and reuses cache', async () => {
    render(
      <div>
        <Probe companyId={1} />
        <Probe companyId={1} />
      </div>,
    );

    await waitFor(() => {
      screen.getAllByTestId('probe').forEach((el) => {
        expect(el.textContent).not.toMatch(/loading/);
      });
    });

    const { supabase } = require('../../supabaseClient');
    expect(supabase.from).toHaveBeenCalledTimes(1);
    expect(supabase.from).toHaveBeenCalledWith('company_translations');
  });

  it('getTranslation falls back and save/delete update state', async () => {
    const { supabase, __mocks__ } = require('../../supabaseClient');

    // initial fetch returns one english translation
    __mocks__.mockEq.mockResolvedValueOnce({
      data: [{ language_code: 'en', info: 'Hello' }],
      error: null,
    });

    // render component that exercises helper methods
    function ActionProbe({ companyId }) {
      const { translations, loading, getTranslation, saveTranslation, deleteTranslation } =
        useCompanyTranslations(companyId);
      const [text, setText] = React.useState('');

      React.useEffect(() => {
        // update whenever translations or loading state changes
        if (!loading) {
          setText(getTranslation('en', 'nl'));
        }
      }, [loading, getTranslation, translations]);

      return (
        <div>
          <div data-testid="data">{loading ? 'loading' : JSON.stringify(translations)}</div>
          <div data-testid="translated">{text}</div>
          <button data-testid="save" onClick={() => saveTranslation('nl', 'Hoi')}>
            save
          </button>
          <button data-testid="del" onClick={() => deleteTranslation('nl')}>
            del
          </button>
        </div>
      );
    }

    render(<ActionProbe companyId={2} />);

    // wait for initial load and the helper to compute translation
    await waitFor(() => {
      expect(screen.getByTestId('data').textContent).toContain('Hello');
      expect(screen.getByTestId('translated').textContent).toBe('Hello');
    });

    // simulate saving a new translation - upsert should be called
    act(() => {
      screen.getByTestId('save').click();
    });
    await waitFor(() => expect(screen.getByTestId('data').textContent).toContain('Hoi'));

    // now deleting translation
    act(() => {
      screen.getByTestId('del').click();
    });
    await waitFor(() => expect(screen.getByTestId('data').textContent).not.toContain('Hoi'));

    // ensure network calls for upsert/delete
    expect(__mocks__.mockUpsert).toHaveBeenCalled();
    expect(__mocks__.mockDelete).toHaveBeenCalled();
  });
});
