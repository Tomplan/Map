import { renderHook } from '@testing-library/react';
import useAnalytics from './useAnalytics';

describe('useAnalytics', () => {
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('trackMarkerView logs marker view event', () => {
    const { result } = renderHook(() => useAnalytics());
    result.current.trackMarkerView(42);
    expect(console.log).toHaveBeenCalledWith(
      'Analytics event:',
      'marker_view',
      expect.objectContaining({ markerId: 42 })
    );
  });

  test('trackMapInteraction logs map interaction event', () => {
    const { result } = renderHook(() => useAnalytics());
    result.current.trackMapInteraction('map_ready');
    expect(console.log).toHaveBeenCalledWith(
      'Analytics event:',
      'map_interaction',
      expect.objectContaining({ type: 'map_ready' })
    );
  });
});
