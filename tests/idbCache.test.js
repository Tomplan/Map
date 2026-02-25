/* eslint-env jest */
// Use fake-indexeddb to provide IndexedDB in Jest environment
import 'fake-indexeddb/auto';

import {
  getMarkerSnapshot,
  setMarkerSnapshot,
  clearMarkerSnapshot,
  enqueueOfflineAction,
  getOfflineQueue,
  clearOfflineQueue,
} from '../src/services/idbCache';

describe('idbCache', () => {
  afterEach(async () => {
    await clearMarkerSnapshot();
    await clearOfflineQueue();
  });

  test('set and get marker snapshot', async () => {
    const sample = [{ id: 1, name: 'Test' }];
    const ok = await setMarkerSnapshot(sample);
    expect(ok).toBe(true);
    const got = await getMarkerSnapshot();
    expect(got).toEqual(sample);
  });

  test('enqueue and retrieve offline queue', async () => {
    const action = { type: 'create', payload: { id: 5 } };
    const ok = await enqueueOfflineAction(action);
    expect(ok).toBe(true);
    const q = await getOfflineQueue();
    expect(q.length).toBeGreaterThanOrEqual(1);
    expect(q.some((a) => a.type === 'create')).toBe(true);
  });
});
