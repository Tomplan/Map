import React from 'react';
import { render, act } from '@testing-library/react';
import '@testing-library/jest-dom';

import { useCompanyMutations } from '../useCompanyMutations';

function TestHarness(props) {
  // expose the hook return value so tests can call its methods

  const h = useCompanyMutations(props);
  // attach to window so test can access
  // (simple pattern used in this repo for small hook tests)
  // @ts-ignore
  window.__hook = h;
  return null;
}

describe('useCompanyMutations (organization save)', () => {
  it('calls updateProfile with manager-only fields when editing organization', async () => {
    const mockUpdateProfile = jest.fn().mockResolvedValue({ data: {}, error: null });

    render(
      <TestHarness
        createCompany={jest.fn()}
        updateCompany={jest.fn()}
        deleteCompany={jest.fn()}
        updateProfile={mockUpdateProfile}
        organizationLogo="/org-logo.png"
        confirm={jest.fn()}
        toastError={jest.fn()}
      />,
    );

    // Start edit for the special organization row
    act(() => {
      // @ts-ignore
      window.__hook.handleEdit({
        id: 'organization',
        name: 'Org name',
        contact: 'Alice',
        phone: '+31201234567',
        email: 'ALICE@EXAMPLE.COM',
      });
    });

    // Save (should call updateProfile with the contact/phone/email present in editForm)
    await act(async () => {
      // @ts-ignore
      await window.__hook.handleSave();
    });

    expect(mockUpdateProfile).toHaveBeenCalledTimes(1);
    expect(mockUpdateProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Org name',
        contact: 'Alice',
        phone: '+31201234567',
        email: 'ALICE@EXAMPLE.COM',
      }),
    );
  });
});
