import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock i18n used by translateSafe
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k) => { const map = { 'languages.dutch': 'Nederlands', 'languages.english': 'English' }; return map[k] || k; } }) }));

// Mock the useCompanyMutations hook
jest.mock('../../../hooks/useCompanyMutations', () => ({
  useCompanyMutations: () => ({
    editingId: null,
    editForm: {},
    setEditForm: jest.fn(),
    isCreating: true,
    newCompanyForm: { name: 'NewCo', translations: {} },
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

// Render InfoFieldWithTranslations in create-mode
import InfoFieldWithTranslations from '../InfoFieldWithTranslations';

describe('InfoFieldWithTranslations (create mode)', () => {
  test('updates translations on blur and calls callback', async () => {
    const onTranslationsChange = jest.fn();

    render(
      <InfoFieldWithTranslations
        createMode={true}
        initialTranslations={{}}
        onTranslationsChange={onTranslationsChange}
        editingLanguage={'nl'}
        onLanguageChange={() => {}}
      />,
    );

    // Language tabs should render (Nederlands tab present)
    expect(await screen.findByText('Nederlands')).toBeInTheDocument();

    // Find the textarea for the current language
    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeInTheDocument();

    // Type some content and blur to trigger onTranslationsChange
    fireEvent.change(textarea, { target: { value: 'Nieuwe inhoud' } });
    fireEvent.blur(textarea);

    // onTranslationsChange should be called with translations updated
    expect(onTranslationsChange).toHaveBeenCalled();
    const calls = onTranslationsChange.mock.calls;
    const lastArg = calls[calls.length - 1][0];
    expect(lastArg).toHaveProperty('nl');
    expect(lastArg.nl).toBe('Nieuwe inhoud');
  });
});
