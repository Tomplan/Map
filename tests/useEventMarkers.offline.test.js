/* eslint-env jest */
import 'fake-indexeddb/auto';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import useEventMarkers from '../src/hooks/useEventMarkers';
import { setMarkerSnapshot, clearMarkerSnapshot } from '../src/services/idbCache';

function TestHarness() {
  const { markers, loading } = useEventMarkers(2025);
  return <div data-testid="markers">{loading ? 'loading' : JSON.stringify(markers)}</div>;
}

describe('useEventMarkers offline behavior', () => {
  beforeEach(async () => {
    await clearMarkerSnapshot();
    // Force offline environment
    Object.defineProperty(window.navigator, 'onLine', { value: false, configurable: true });
  });

  afterEach(async () => {
    await clearMarkerSnapshot();
    Object.defineProperty(window.navigator, 'onLine', { value: true, configurable: true });
  });

  test('reads snapshot from IndexedDB when offline', async () => {
    const sample = [{ id: 42, name: 'Offline Marker' }];
    await setMarkerSnapshot(sample);

    render(<TestHarness />);

    await waitFor(() => expect(screen.getByTestId('markers').textContent).not.toBe('loading'));

    expect(screen.getByTestId('markers').textContent).toContain('Offline Marker');
  });
});
