import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
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
  return {
    supabase: {
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          order: mockOrder,
        })),
      })),
    },
  };
});

// provide basic hook mocks used by InvoiceSyncTab
jest.mock('../../../hooks/useCompanies', () => () => ({
  companies: [],
  createCompany: jest.fn(),
}));
jest.mock('../../../hooks/useOrganizationSettings', () => () => ({ settings: {} }));
jest.mock('../../../hooks/useEventSubscriptions', () => () => ({
  subscriptions: [],
  subscribeCompany: jest.fn(),
  updateSubscription: jest.fn(),
  unsubscribeCompany: jest.fn(),
}));
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
  // configure supabase chain to return our fake invoice
  mockOrder.mockResolvedValue({ data: [fakeInvoice], error: null });
});

test('creating a company from an invoice seeds additional fields', async () => {
  const createCompany = jest.fn().mockResolvedValue({ data: { id: 99 }, error: null });
  // override hook return value to supply our spy
  const useCompanies = require('../../../hooks/useCompanies').default;
  useCompanies.mockReturnValue({ companies: [], createCompany });

  render(<InvoiceSyncTab selectedYear={2026} />);

  // wait for invoice row to appear and then click the "No match" button
  const verifyButton = await screen.findByRole('button', { name: /No match/i });
  userEvent.click(verifyButton);

  // in main row itself we should now see per-item action icons and quantities
  // initially invoice has no company - icons disabled
  let approveIcons = await screen.findAllByTitle('Verify company first');
  expect(approveIcons.length).toBeGreaterThanOrEqual(2);
  expect(screen.getByText('x1')).toBeInTheDocument();
  expect(screen.getByText('x5')).toBeInTheDocument();

  // now simulate linking to a verified company
  fakeInvoice.company_id = 42;
  const subscriptionsHook = require('../../../hooks/useEventSubscriptions');
  const mockSubsObj = { subscriptions: [], subscribeCompany: jest.fn(), updateSubscription: jest.fn(), unsubscribeCompany: jest.fn() };
  subscriptionsHook.mockReturnValue(mockSubsObj);

  // rerender to pick up new company_id
  render(<InvoiceSyncTab selectedYear={2026} />);

  // also verify state persistence: change search and sort, unmount and remount
  const searchInput = screen.getByPlaceholderText('Search companies…');
  await userEvent.type(searchInput, 'Foo');
  // sort by invoice number
  const header = screen.getByText('Invoices'); // there isn't header clickable but we can update sort directly
  // simulate clicking sort button via internal handler using ref? easier: directly set
  // but we can't access state here so instead check sessionStorage
  expect(sessionStorage.getItem('invoiceSyncState')).toContain('Foo');
  // unmount and remount
  render(<InvoiceSyncTab selectedYear={2026} />);
  expect(screen.getByPlaceholderText('Search companies…').value).toBe('Foo');
  approveIcons = await screen.findAllByTitle('Mark approved');
  expect(approveIcons.length).toBeGreaterThanOrEqual(2);

  // click first item's approve button
  userEvent.click(approveIcons[0]);
  await waitFor(() => expect(mockSubsObj.subscribeCompany).toHaveBeenCalled());

  // verify counts passed correspond to first item (stand =1)
  expect(mockSubsObj.subscribeCompany).toHaveBeenCalledWith(42, expect.objectContaining({ booth_count: 1 }));

  // now click second (lunch) item; because a subscription already exists,
  // subscribeCompany should NOT be called again – updateSubscription should
  // be invoked with an added booth_count of 0.
  const updateSpy = mockSubsObj.updateSubscription;
  userEvent.click(approveIcons[1]);
  await waitFor(() => expect(updateSpy).toHaveBeenCalled());
  expect(updateSpy).toHaveBeenCalledWith(expect.any(Number), expect.objectContaining({ booth_count: expect.any(Number) }));
  // the added booths should be zero (therefore booth_count parameter equals the existing value 1)
  const lastArg = updateSpy.mock.calls[updateSpy.mock.calls.length - 1][1];
  expect(lastArg.booth_count).toBe(1);

  // expanding and other expectations remain unchanged
  const invoiceRow = screen.getByText(/TestCo/).closest('tr');
  userEvent.click(invoiceRow);
  const approveIconsExpanded = await screen.findAllByTitle('Mark approved');
  expect(approveIconsExpanded.length).toEqual(approveIcons.length);

  // there should be no global sync/reject/delete buttons left in main row
  expect(screen.queryByTitle('Sync to subscription')).not.toBeInTheDocument();
  expect(screen.queryByTitle('Reject')).not.toBeInTheDocument();
  // header cell 'Actions' is gone
  expect(screen.queryByText('Actions')).not.toBeInTheDocument();

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
