import { renderHook, waitFor } from '@testing-library/react';
import useEventMarkers from './useEventMarkers';

describe('useEventMarkers', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.resetModules();
  });

  test('fetches and caches marker data', async () => {
    const { result } = renderHook(() => useEventMarkers());
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.markers.length).toBeGreaterThan(0);
    // Should cache to localStorage
    const cached = JSON.parse(localStorage.getItem('eventMarkers'));
    expect(cached.length).toBeGreaterThan(0);
  });

  test('loads markers from cache if available', async () => {
    localStorage.setItem('eventMarkers', JSON.stringify([
      { id: 99, lat: 0, lng: 0, label: 'Cached Marker' }
    ]));
    const { result } = renderHook(() => useEventMarkers());
    expect(result.current.loading).toBe(false);
    expect(result.current.markers[0].label).toBe('Cached Marker');
  });

  test('uses cached markers when offline', async () => {
    localStorage.setItem('eventMarkers', JSON.stringify([
      { id: 77, lat: 1, lng: 1, label: 'Offline Marker' }
    ]));
    const originalNavigator = global.navigator;
    global.navigator = { onLine: false };
    const { result } = renderHook(() => useEventMarkers());
    expect(result.current.loading).toBe(false);
    expect(result.current.markers[0].label).toBe('Offline Marker');
    global.navigator = originalNavigator;
  });
});
