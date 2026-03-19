import { getBaseUrl } from '../getBaseUrl';

describe('getBaseUrl', () => {
  const originalBaseUrl = global.__APP_BASE_URL__;

  afterEach(() => {
    global.__APP_BASE_URL__ = originalBaseUrl;
  });

  it('returns compile-time __APP_BASE_URL__ when defined', () => {
    global.__APP_BASE_URL__ = '/Map/';
    expect(getBaseUrl()).toBe('/Map/');

    global.__APP_BASE_URL__ = '/';
    expect(getBaseUrl()).toBe('/');
  });

  it('falls back to window.location.pathname when __APP_BASE_URL__ is undefined', () => {
    global.__APP_BASE_URL__ = undefined;

    window.history.pushState({}, 'Test Title', '/Map/dev/');
    expect(getBaseUrl()).toBe('/Map/dev/');

    window.history.pushState({}, 'Test Title', '/Map/dev/index.html');
    expect(getBaseUrl()).toBe('/Map/dev/');

    window.history.pushState({}, 'Test Title', '/Map/');
    expect(getBaseUrl()).toBe('/Map/');

    window.history.pushState({}, 'Test Title', '/');
    expect(getBaseUrl()).toBe('/');
  });
});
