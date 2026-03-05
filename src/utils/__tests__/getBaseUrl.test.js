import { getBaseUrl } from '../getBaseUrl';

describe('getBaseUrl', () => {
  const setPathname = (path) => {
    delete window.location;
    window.location = { pathname: path };
  };

  it('extracts base URL up to the last slash', () => {
    setPathname('/Map/dev/');
    expect(getBaseUrl()).toBe('/Map/dev/');

    setPathname('/Map/dev/index.html');
    expect(getBaseUrl()).toBe('/Map/dev/');
    
    setPathname('/Map/');
    expect(getBaseUrl()).toBe('/Map/');
    
    setPathname('/');
    expect(getBaseUrl()).toBe('/');
  });

  it('respects __APP_BASE_URL__ global when window not available', () => {
    // temporarily remove window
    const oldWindow = global.window;
    delete global.window;
    global.__APP_BASE_URL__ = '/fake-base/';

    expect(getBaseUrl()).toBe('/fake-base/');

    // cleanup
    global.__APP_BASE_URL__ = undefined;
    global.window = oldWindow;
  });
});