/* eslint-env jest */
import 'fake-indexeddb/auto';

import { scheduleMapPrefetchOnIdle } from '../src/services/prefetchOnIdle';
import * as idb from '../src/services/idbCache';

describe('prefetchOnIdle', () => {
  beforeEach(() => {
    // Mock service worker controller
    Object.defineProperty(navigator, 'serviceWorker', {
      value: { controller: { postMessage: jest.fn() } },
      configurable: true,
    });
    jest.spyOn(idb, 'getMarkerSnapshot').mockResolvedValue([{ id: 1, name: 'cached' }]);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('schedules prefetch and posts snapshot to SW', async () => {
    // Force immediate run by invoking with `immediate: true`
    await scheduleMapPrefetchOnIdle({ immediate: true });
    expect(navigator.serviceWorker.controller.postMessage).toHaveBeenCalled();
    const called = navigator.serviceWorker.controller.postMessage.mock.calls;
    expect(called.some((c) => c[0] && c[0].type === 'STORE_SNAPSHOT')).toBe(true);
  });
});
