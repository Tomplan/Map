import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import EventSubscriptionsTab from '../EventSubscriptionsTab';

const mockExportButton = jest.fn();

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, fallback, options) => {
      if (typeof fallback === 'string') {
        if (options) {
          return fallback.replace(/\{\{(\w+)\}\}/g, (_, token) => String(options[token] ?? ''));
        }
        return fallback;
      }

      return key;
    },
  }),
}));

jest.mock('../../../hooks/useEventSubscriptions', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    subscriptions: [
      {
        id: 10,
        company_id: 1,
        event_year: 2026,
        contact: 'Jane Doe',
        phone: '+31612345678',
        email: 'jane@alpha.test',
        booth_count: 1,
        area: '',
        breakfast_sat: 0,
        lunch_sat: 0,
        bbq_sat: 0,
        breakfast_sun: 0,
        lunch_sun: 0,
        coins: 0,
        notes: '',
        history: '',
        company: { id: 1, name: 'Alpha BV', logo: '' },
      },
    ],
    loading: false,
    error: null,
    subscribeCompany: jest.fn(),
    updateSubscription: jest.fn(),
    unsubscribeCompany: jest.fn(),
    archiveCurrentYear: jest.fn(),
    copyFromPreviousYear: jest.fn(),
    reload: jest.fn(),
  })),
}));

jest.mock('../../../hooks/useCompanies', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    companies: [
      { id: 1, name: 'Alpha BV', contact: 'Jane Doe', phone: '+31612345678', email: 'jane@alpha.test', city: 'Utrecht' },
      { id: 2, name: 'Beta BV', contact: 'John Doe', phone: '+31611111111', email: 'john@beta.test', city: 'Amsterdam' },
      { id: 3, name: 'Gamma BV', contact: '', phone: '', email: '', city: '' },
    ],
  })),
}));

jest.mock('../../../hooks/useAssignments', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    assignments: [],
    reload: jest.fn(),
  })),
}));

jest.mock('../../../hooks/useMarkerGlyphs', () => ({
  __esModule: true,
  useMarkerGlyphs: jest.fn(() => ({
    markers: [],
    loading: false,
  })),
}));

jest.mock('../../../contexts/OrganizationLogoContext', () => ({
  useOrganizationLogo: () => ({ organizationLogo: '' }),
}));

jest.mock('../../../contexts/DialogContext', () => ({
  useDialog: () => ({
    confirm: jest.fn(),
    toastError: jest.fn(),
    toastSuccess: jest.fn(),
    toastWarning: jest.fn(),
  }),
}));

jest.mock('../../../supabaseClient', () => ({
  supabase: {},
}));

jest.mock('../../../utils/getLogoPath', () => ({
  getLogoPath: jest.fn(() => '/mock-logo.png'),
  getResponsiveLogoSources: jest.fn(() => null),
}));

jest.mock('../../common/ImportButton', () => () => <div data-testid="import-button" />);

jest.mock('../../common/ExportButton', () => ({
  __esModule: true,
  default: (props) => {
    mockExportButton(props);
    return (
      <div
        data-testid={`export-button-${props.dataType}`}
        data-count={props.data?.length ?? 0}
      />
    );
  },
}));

jest.mock('../SubscriptionEditModal', () => () => null);

describe('EventSubscriptionsTab unsubscribed companies action', () => {
  beforeEach(() => {
    mockExportButton.mockClear();
  });

  it('lists and exports companies with a subscription for the selected year', () => {
    render(<EventSubscriptionsTab selectedYear={2026} />);

    fireEvent.click(screen.getByRole('button', { name: /common.actions/i }));
    fireEvent.click(screen.getByText('MailingList Subscribed Companies'));

    expect(screen.getByText('Companies with a subscription for 2026.')).toBeInTheDocument();
    expect(screen.getByText('1 companies found with a subscription for 2026.')).toBeInTheDocument();

    const subscribedExport = screen.getByTestId('export-button-subscribed_companies');
    expect(subscribedExport).toHaveAttribute('data-count', '1');

    const subscribedProps = mockExportButton.mock.calls
      .map(([props]) => props)
      .find((props) => props.dataType === 'subscribed_companies');

    expect(subscribedProps.data.map((company) => company.name)).toEqual(['Alpha BV']);
    expect(subscribedProps.filename).toMatch(/^mailinglist-subscribed-companies-2026-/);
  });

  it('lists and exports companies without a subscription for the selected year', () => {
    render(<EventSubscriptionsTab selectedYear={2026} />);

    fireEvent.click(screen.getByRole('button', { name: /common.actions/i }));
    fireEvent.click(screen.getByText('MailingList Unsubscribed Companies'));

    expect(screen.getByText('Companies without a subscription for 2026.')).toBeInTheDocument();
    expect(screen.getByText('2 companies found without a subscription for 2026.')).toBeInTheDocument();

    expect(screen.getByText('Beta BV')).toBeInTheDocument();
    expect(screen.getByText('Gamma BV')).toBeInTheDocument();

    const unsubscribedExport = screen.getByTestId('export-button-unsubscribed_companies');
    expect(unsubscribedExport).toHaveAttribute('data-count', '2');

    const unsubscribedProps = mockExportButton.mock.calls
      .map(([props]) => props)
      .find((props) => props.dataType === 'unsubscribed_companies');

    expect(unsubscribedProps.data.map((company) => company.name)).toEqual(['Beta BV', 'Gamma BV']);
    expect(unsubscribedProps.filename).toMatch(/^mailinglist-unsubscribed-companies-2026-/);
  });
});