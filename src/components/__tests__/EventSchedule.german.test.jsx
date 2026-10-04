import React from 'react';
import { act, render, screen } from '@testing-library/react';
import '../../i18n';
import i18n from '../../i18n';

jest.mock('../../hooks/useEventActivities', () => ({
  __esModule: true,
  default: jest.fn(),
}));

import useEventActivities from '../../hooks/useEventActivities';
import EventSchedule from '../EventSchedule';

describe('EventSchedule German localization', () => {
  beforeEach(async () => {
    useEventActivities.mockReturnValue({
      activities: {
        saturday: [
          {
            id: 'activity-1',
            is_active: true,
            start_time: '10:00',
            end_time: '11:00',
            title_nl: 'Nederlandse titel',
            description_nl: 'Nederlandse beschrijving',
            badge_nl: 'Nederlandse badge',
          },
        ],
        sunday: [],
      },
      loading: false,
      error: null,
      getActivityLocation: () => ({ text: 'Locatie', boothNumber: null }),
    });

    await act(async () => {
      await i18n.changeLanguage('de');
    });
  });

  afterEach(async () => {
    await act(async () => {
      await i18n.changeLanguage('nl');
    });
    useEventActivities.mockReset();
  });

  it('shows German schedule labels and falls back to Dutch activity content', () => {
    render(<EventSchedule selectedYear={2026} />);

    expect(screen.getByRole('heading', { name: 'Programm' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Samstag' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sonntag' })).toBeInTheDocument();
    expect(screen.getByText('Nederlandse titel')).toBeInTheDocument();
    expect(screen.getByText('Nederlandse beschrijving')).toBeInTheDocument();
    expect(screen.getByText('Nederlandse badge')).toBeInTheDocument();
  });
});