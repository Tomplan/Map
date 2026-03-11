import React from 'react';
import { render, screen, waitFor, cleanup, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// mock i18n
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (k, opts) => (typeof opts === 'string' ? opts : opts?.defaultValue) || k,
    i18n: { language: 'en', exists: () => true },
  }),
}));

// need to mock supabase client so InvoiceSyncTab can fetch invoices
const mockOrder = jest.fn();
const fakeInvoice = {
  id: 1,
  company_name: 'TestCo',
  phone: '12345',
  email: 'foo@test.com',
  notes: JSON.stringify({
    contact_name: 'Alice',
    contact_email: 'alice@test.com',
    contact_phone: '+311234567',
    address_line1: '1 Main St',
    postal_code: '1000 AA',
    city: 'Testville',
    country: 'NL',
    vat_number: 'NL123',
    kvk_number: '98765432',
    line_items: [
      { item: 'Stand 6x6', quantity: 1 },
      { description: 'Lunch tickets', quantity: 5 },
    ],
  }),
};

jest.mock('../../../supabaseClient', () => {
  const channelStub = jest.fn(() => ({
    on: jest.fn().mockReturnThis(),
    subscribe: jest.fn(),
  }));
  // helper to create from-chains used by the component
  const fromMock = jest.fn(() => ({
    select: jest.fn(() => ({
      order: mockOrder,
    })),
    update: jest.fn(() => ({
      eq: jest.fn(() => Promise.resolve({ error: null })),
    })),
  }));
  return {
    supabase: {
      from: fromMock,
      channel: channelStub,
      removeChannel: jest.fn(),
    },
  };
});

// provide basic hook mocks used by InvoiceSyncTab
jest.mock('../../../hooks/useCompanies', () =>
  jest.fn(() => ({
    companies: [],
    createCompany: jest.fn(),
  })),
);

jest.mock('../../../hooks/useOrganizationSettings', () => () => ({ settings: {} }));

jest.mock('../../../hooks/useEventSubscriptions', () =>
  jest.fn(() => ({
    subscriptions: [],
    subscribeCompany: jest.fn(),
    updateSubscription: jest.fn(),
    unsubscribeCompany: jest.fn(),
  })),
);
jest.mock('../../../contexts/DialogContext', () => ({
  useDialog: () => ({
    toastSuccess: jest.fn(),
    toastWarning: jest.fn(),
    toastError: jest.fn(),
    confirm: async () => true,
  }),
}));

import InvoiceSyncTab from '../InvoiceSyncTab';

beforeEach(() => {
  jest.clearAllMocks();
  sessionStorage.clear();
  // configure supabase chain to return our fake invoice
  mockOrder.mockResolvedValue({ data: [fakeInvoice], error: null });
});

afterEach(() => {
  // cleanup DOM between tests to avoid leftover modals or multiple containers
  cleanup();
});

test('creating a company from an invoice seeds additional fields', async () => {
  const createCompany = jest.fn().mockResolvedValue({ data: { id: 99 }, error: null });
  // override hook return value to supply our spy
  const useCompanies = require('../../../hooks/useCompanies');
  useCompanies.mockReturnValue({ companies: [], createCompany });

  render(<InvoiceSyncTab selectedYear={2026} />);

  // wait for invoice row to appear and then click the "No match" button
  const verifyButton = await screen.findByRole('button', { name: /No match/i });
  userEvent.click(verifyButton);

  // CompanySearchModal should appear with create new button
  const createBtn = await screen.findByRole('button', { name: /Create new company/i });
  userEvent.click(createBtn);

  // ensure our mocked createCompany was called with contact/address data from invoice
  await waitFor(() => expect(createCompany).toHaveBeenCalled());
  expect(createCompany).toHaveBeenCalledWith(
    expect.objectContaining({
      name: 'TestCo',
      phone: '12345',
      email: 'foo@test.com',
      contact_name: 'Alice',      contact: 'Alice',      contact_email: 'alice@test.com',
      contact_phone: '+311234567',
      address_line1: '1 Main St',
      postal_code: '1000 AA',
      city: 'Testville',
      country: 'NL',
      vat_number: 'NL123',
      kvk_number: '98765432',
    }),
  );
});
// -----------------------------------------------------------------------------
// Additional test for undo functionality
// -----------------------------------------------------------------------------

test('approved line item shows undo and reverses subscription counts', async () => {
  // simple invoice with a single line item and already-linked company
  const undoInvoice = {
    ...fakeInvoice,
    company_id: 42,
    notes: JSON.stringify({
      ...JSON.parse(fakeInvoice.notes),
      line_items: [{ item: 'Stand 6x6', quantity: 1 }],
    }),
  };

  mockOrder.mockResolvedValue({ data: [undoInvoice], error: null });

  const subsMock = {
    subscriptions: [{ id: 500, company_id: 42, booth_count: 2 }],
    subscribeCompany: jest.fn(),
    updateSubscription: jest.fn().mockResolvedValue({ data: {}, error: null }),
    unsubscribeCompany: jest.fn(),
  };
  const subsHook = require('../../../hooks/useEventSubscriptions');
  subsHook.mockReturnValue(subsMock);

  render(<InvoiceSyncTab selectedYear={2026} />);

  // wait for the invoice row to appear
  await waitFor(() => expect(screen.getByText('TestCo')).toBeInTheDocument());

  // approve the line item (company_id is already set so approve button is enabled)
  const approve = await screen.findByTitle('Mark approved');
  await act(async () => {
    userEvent.click(approve);
  });

  // first updateSubscription call should increment booth count from 2 to 3
  await waitFor(() => expect(subsMock.updateSubscription).toHaveBeenCalledTimes(1));
  const firstBoothCount = subsMock.updateSubscription.mock.calls[0][1].booth_count;
  expect(firstBoothCount).toBe(3);

  // undo button appears now that the item has a non-pending status
  const undoBtn = await screen.findByTitle('Undo change');
  await act(async () => {
    userEvent.click(undoBtn);
  });

  // second updateSubscription call should subtract the booth count back
  await waitFor(() => expect(subsMock.updateSubscription).toHaveBeenCalledTimes(2));
  const secondBoothCount = subsMock.updateSubscription.mock.calls[1][1].booth_count;
  expect(secondBoothCount).toBeLessThan(firstBoothCount);
});
