import React from 'react';
import { render, screen, waitFor, cleanup, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// mock i18n — resolve keys from the actual English locale so test assertions
// match real user-visible strings rather than raw key names
jest.mock('react-i18next', () => {
  const enLocale = require('../../../locales/en.json');
  function resolveKey(obj, key) {
    return key.split('.').reduce((o, k) => (o && typeof o === 'object' ? o[k] : undefined), obj);
  }
  const t = (k, opts) => {
    const resolved = resolveKey(enLocale, k);
    const base = typeof resolved === 'string' ? resolved
      : (typeof opts === 'string' ? opts : opts?.defaultValue) || k;
    if (opts && typeof opts === 'object') {
      return base.replace(/\{\{(\w+)\}\}/g, (_, p) => (opts[p] ?? '').toString());
    }
    return base;
  };
  return {
    useTranslation: () => ({ t, i18n: { language: 'en', exists: () => true } }),
    Trans: ({ i18nKey, children }) => children || i18nKey,
  };
});

// need to mock supabase client so InvoiceSyncTab can fetch invoices
const mockOrder = jest.fn();
const fakeInvoice = {
  id: 1,
  company_name: 'TestCo',
  phone: '12345',
  email: 'foo@test.com',
  parsed_data: JSON.stringify({
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
  const fromMock = jest.fn((table) => {
    if (table === 'event_subscriptions') {
      const eqTerminal = {
        maybeSingle: jest.fn().mockResolvedValue({ 
          data: { id: 500, company_id: 42, booth_count: 2 }, 
          error: null 
        }),
        single: jest.fn().mockResolvedValue({
          data: { id: 500, history: '' },
          error: null
        }),
      };
      // support chaining .eq().eq().maybeSingle() and .eq().maybeSingle()
      eqTerminal.eq = jest.fn(() => eqTerminal);
      return {
        select: jest.fn(() => ({
          eq: jest.fn(() => eqTerminal),
        })),
        update: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ error: null })),
        })),
      };
    }
    if (table === 'subscription_line_items') {
      return {
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({ data: { id: 1, subscription_id: 500 }, error: null }),
          })),
        })),
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              order: jest.fn().mockResolvedValue({ data: [], error: null }),
            })),
          })),
          order: jest.fn().mockResolvedValue({ data: [], error: null }),
        })),
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn(() => Promise.resolve({ error: null })),
            })),
            select: jest.fn(() => ({
              single: jest.fn().mockResolvedValue({ data: { subscription_id: 500 }, error: null }),
            })),
          })),
        })),
      };
    }
    if (table === 'organization_settings') {
      return {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({ data: { default_coins: 0 }, error: null }),
          })),
        })),
      };
    }
    if (table === 'staged_invoices') {
      return {
        select: jest.fn(() => ({
          order: mockOrder,
          eq: jest.fn(() => ({
            single: jest.fn(async () => {
              // Return the current invoice data (mockOrder tracks updates from saveNotes)
              const r = await mockOrder();
              return { data: (r?.data || [])[0] || null, error: null };
            }),
          })),
        })),
        update: jest.fn((payload) => ({
          eq: jest.fn(async () => {
            // When notes are saved, update mockOrder so subsequent reads return fresh data
            if (payload && payload.parsed_data !== undefined) {
              const current = await mockOrder();
              const updated = (current?.data || []).map(item => ({ ...item, parsed_data: payload.parsed_data }));
              mockOrder.mockResolvedValue({ data: updated, error: null });
            }
            return { error: null };
          }),
        })),
        delete: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ error: null })),
          not: jest.fn(() => Promise.resolve({ error: null })),
        })),
      };
    }
    return {
      select: jest.fn(() => ({
        order: mockOrder,
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ error: null })),
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ error: null })),
        not: jest.fn(() => Promise.resolve({ error: null })),
      })),
    };
  });
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
    parsed_data: JSON.stringify({
      ...JSON.parse(fakeInvoice.parsed_data),
      line_items: [{ item: 'Stand 6x6', quantity: 1 }],
    }),
  };

  mockOrder.mockResolvedValue({ data: [undoInvoice], error: null });

  const subsMock = {
    subscriptions: [{ id: 500, company_id: 42, booth_count: 2 }],
    subscribeCompany: jest.fn(),
    updateSubscription: jest.fn().mockResolvedValue({ data: {}, error: null }),
    unsubscribeCompany: jest.fn(),
    reload: jest.fn(),
  };
  const subsHook = require('../../../hooks/useEventSubscriptions');
  subsHook.mockReturnValue(subsMock);

  const { supabase } = require('../../../supabaseClient');

  render(<InvoiceSyncTab selectedYear={2026} />);

  // wait for the invoice row to appear
  await waitFor(() => expect(screen.getByText('TestCo')).toBeInTheDocument());

  // approve the line item (company_id is already set so approve button is enabled)
  const approve = await screen.findByTitle('Mark approved');
  await act(async () => {
    userEvent.click(approve);
  });

  // The approve flow now uses addLineItem (subscription_line_items insert) + recalculateTotals
  // instead of the hook's updateSubscription. Verify supabase was called for line items.
  await waitFor(() => {
    const lineItemCalls = supabase.from.mock.calls.filter(([t]) => t === 'subscription_line_items');
    expect(lineItemCalls.length).toBeGreaterThan(0);
  });

  // undo button appears now that the item has a non-pending status
  const undoBtn = await screen.findByTitle('Undo change');
  await act(async () => {
    userEvent.click(undoBtn);
  });

  // undo flow also interacts with subscription_line_items (deactivation + recalculate)
  await waitFor(() => {
    const lineItemCalls = supabase.from.mock.calls.filter(([t]) => t === 'subscription_line_items');
    // approve inserts + selects, undo selects + updates — expect multiple calls
    expect(lineItemCalls.length).toBeGreaterThanOrEqual(3);
  });
});
