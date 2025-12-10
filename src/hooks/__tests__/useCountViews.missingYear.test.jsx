import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import {
  useSubscriptionCount,
  useAssignmentCount,
  useMarkerCount,
} from '../useCountViews';

function ProbeSubscription({ year }) {
  const { count, loading, error } = useSubscriptionCount(year);
  return (
    <div data-testid={`sub-${String(year)}`}>
      {JSON.stringify({ count, loading, error })}
    </div>
  );
}

function ProbeAssignment({ year }) {
  const { count, loading, error } = useAssignmentCount(year);
  return (
    <div data-testid={`ass-${String(year)}`}>
      {JSON.stringify({ count, loading, error })}
    </div>
  );
}

function ProbeMarker({ year }) {
  const { count, loading, error } = useMarkerCount(year);
  return (
    <div data-testid={`mark-${String(year)}`}>
      {JSON.stringify({ count, loading, error })}
    </div>
  );
}

describe('useCountViews guards', () => {
  it('returns safe values when eventYear is undefined', async () => {
    render(
      <div>
        <ProbeSubscription year={undefined} />
        <ProbeAssignment year={undefined} />
        <ProbeMarker year={undefined} />
      </div>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('sub-undefined').textContent).toMatch(/"count":0/);
      expect(screen.getByTestId('sub-undefined').textContent).toMatch(/"loading":false/);
      expect(screen.getByTestId('ass-undefined').textContent).toMatch(/"count":0/);
      expect(screen.getByTestId('ass-undefined').textContent).toMatch(/"loading":false/);
      expect(screen.getByTestId('mark-undefined').textContent).toMatch(/"count":0/);
      expect(screen.getByTestId('mark-undefined').textContent).toMatch(/"loading":false/);
    });
  });

  it('handles null eventYear similarly', async () => {
    render(
      <div>
        <ProbeSubscription year={null} />
        <ProbeAssignment year={null} />
        <ProbeMarker year={null} />
      </div>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('sub-null').textContent).toMatch(/"count":0/);
      expect(screen.getByTestId('sub-null').textContent).toMatch(/"loading":false/);
      expect(screen.getByTestId('ass-null').textContent).toMatch(/"count":0/);
      expect(screen.getByTestId('ass-null').textContent).toMatch(/"loading":false/);
      expect(screen.getByTestId('mark-null').textContent).toMatch(/"count":0/);
      expect(screen.getByTestId('mark-null').textContent).toMatch(/"loading":false/);
    });
  });
});
