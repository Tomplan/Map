import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';

jest.mock('../../services/idbCache', () => ({
  getMarkerSnapshot: jest.fn(() => Promise.resolve(null)),
  setMarkerSnapshot: jest.fn(() => Promise.resolve()),
}));

jest.mock('../../supabaseClient', () => {
  const registrations = [];

  const tableData = {
    markers_core: [{ id: 1, lat: 1, lng: 2, glyph: 'A1', event_year: 2026 }],
    markers_appearance: [],
    markers_content: [],
    assignments: [
      {
        id: 10,
        marker_id: 1,
        company_id: 7,
        event_year: 2026,
        company: {
          id: 7,
          name: 'DefenderShop',
          logo: '',
          website: 'https://defendershop.com',
          info: 'Legacy info',
          company_translations: [{ language_code: 'nl', info: 'Translated info' }],
        },
      },
    ],
    event_subscriptions: [],
  };

  const makeResult = (table) => Promise.resolve({ data: tableData[table] || [], error: null });

  const mockFrom = jest.fn((table) => ({
    select: jest.fn(() => ({
      or: jest.fn(() => makeResult(table)),
      eq: jest.fn(() => makeResult(table)),
    })),
  }));

  const mockRemoveChannel = jest.fn();
  const mockChannel = jest.fn((name) => {
    const channel = {
      on: jest.fn((eventType, config, callback) => {
        registrations.push({ name, eventType, config, callback });
        return channel;
      }),
      subscribe: jest.fn(() => ({ name })),
    };
    return channel;
  });

  return {
    supabase: {
      from: mockFrom,
      channel: mockChannel,
      removeChannel: mockRemoveChannel,
    },
    __mocks__: {
      mockFrom,
      mockChannel,
      mockRemoveChannel,
      registrations,
    },
  };
});

import useEventMarkers from '../useEventMarkers';

function Probe() {
  const { markers, loading } = useEventMarkers(2026);
  return <div data-testid="probe">{loading ? 'loading' : JSON.stringify(markers)}</div>;
}

describe('useEventMarkers company translations realtime', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('subscribes to company_translations changes and reloads markers when they change', async () => {
    const { __mocks__ } = require('../../supabaseClient');

    render(<Probe />);

    await act(async () => {
      jest.advanceTimersByTime(350);
    });

    await waitFor(() => {
      expect(screen.getByTestId('probe').textContent).toContain('DefenderShop');
    });

    const coreCallsAfterInitialLoad = __mocks__.mockFrom.mock.calls.filter(
      ([table]) => table === 'markers_core',
    ).length;

    const translationRegistration = __mocks__.registrations.find(
      (entry) => entry.config?.table === 'company_translations',
    );

    expect(translationRegistration).toBeTruthy();

    await act(async () => {
      translationRegistration.callback({
        eventType: 'UPDATE',
        new: { company_id: 7, language_code: 'nl', info: 'Updated text' },
      });
      jest.advanceTimersByTime(350);
    });

    await waitFor(() => {
      const coreCallsAfterRealtimeUpdate = __mocks__.mockFrom.mock.calls.filter(
        ([table]) => table === 'markers_core',
      ).length;
      expect(coreCallsAfterRealtimeUpdate).toBeGreaterThan(coreCallsAfterInitialLoad);
    });
  });
});