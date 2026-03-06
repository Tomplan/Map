import { getBaseUrl } from '../getBaseUrl';

describe('getBaseUrl', () => {
  let originalWindow;
  
  beforeEach(() => {
    originalWindow = global.window;
  });

  afterEach(() => {
    global.window = originalWindow;
    global.__APP_BASE_URL__ = undefined;
  });

  it('extracts base URL up to the last slash', () => {
    // Mock window to avoid JSDOM location issues
    global.window = {
      location: {
        pathname: '/Map/dev/'
      }
    };
    expect(getBaseUrl()).toBe('/Map/dev/');

    global.window.location.pathname = '/Map/dev/index.html';
    expect(getBaseUrl()).toBe('/Map/dev/');
    
    global.window.location.pathname = '/Map/';
    expect(getBaseUrl()).toBe('/Map/');
    
    global.window.location.pathname = '/';
    expect(getBaseUrl()).toBe('/');
  });

  it('respects __APP_BASE_URL__ global when window not available', () => {
    // temporarily remove window
    delete global.window;
    global.__APP_BASE_URL__ = '/fake-base/';

    expect(getBaseUrl()).toBe('/fake-base/');
  });
});
