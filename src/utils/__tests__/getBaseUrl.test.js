import { getBaseUrl } from '../getBaseUrl';

describe('getBaseUrl browser behavior', () => {
  afterEach(() => {
    global.__APP_BASE_URL__ = undefined;
  });

  it('extracts base URL up to the last slash', () => {
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
