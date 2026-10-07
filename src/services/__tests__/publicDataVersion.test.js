let mockVersion;
let mockError;

jest.mock('../../supabaseClient', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        maybeSingle: jest.fn(() =>
          Promise.resolve(
            mockError
              ? { data: null, error: mockError }
              : { data: { version: mockVersion }, error: null },
          ),
        ),
      })),
    })),
  },
}));

import { subscribePublicDataVersion } from '../publicDataVersion';

const flush = async () => {
  for (let i = 0; i < 5; i += 1) await Promise.resolve();
};

describe('publicDataVersion poller', () => {
  let randomSpy;

  beforeEach(() => {
    jest.useFakeTimers();
    randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.5);
    mockVersion = 5;
    mockError = null;
  });

  afterEach(() => {
    randomSpy.mockRestore();
    jest.useRealTimers();
  });

  it('notifies only when the version changes', async () => {
    const onChange = jest.fn();
    const sub = subscribePublicDataVersion(onChange);
    await sub.ready;

    await jest.advanceTimersByTimeAsync(95 * 1000);
    expect(onChange).not.toHaveBeenCalled();

    mockVersion = 6;
    await jest.advanceTimersByTimeAsync(95 * 1000);
    expect(onChange).toHaveBeenCalledTimes(1);

    await jest.advanceTimersByTimeAsync(95 * 1000);
    expect(onChange).toHaveBeenCalledTimes(1);

    sub.unsubscribe();
  });

  it('falls back to a periodic reload when the version cannot be read', async () => {
    mockError = { message: 'boom' };
    const onChange = jest.fn();
    const sub = subscribePublicDataVersion(onChange);
    await sub.ready;

    await jest.advanceTimersByTimeAsync(4 * 60 * 1000);
    expect(onChange).not.toHaveBeenCalled();

    await jest.advanceTimersByTimeAsync(2 * 60 * 1000);
    expect(onChange).toHaveBeenCalled();

    sub.unsubscribe();
  });

  it('stops polling after the last unsubscribe', async () => {
    const { supabase } = require('../../supabaseClient');
    const sub = subscribePublicDataVersion(jest.fn());
    await sub.ready;
    sub.unsubscribe();
    supabase.from.mockClear();

    await jest.advanceTimersByTimeAsync(5 * 60 * 1000);
    await flush();
    expect(supabase.from).not.toHaveBeenCalled();
  });
});
