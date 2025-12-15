import { initMiniMap } from '../minimap';

describe('initMiniMap', () => {
  it('adds a MiniMap control when L.Control.MiniMap exists', () => {
    // Mock a fake L.Control.MiniMap constructor
    const fakeMini = function (layer, opts) {
      this.layer = layer;
      this.opts = opts;
    };

    // Create a fake L object and a fake map instance
    const fakeL = global.L || {};
    fakeL.Control = fakeL.Control || {};
    fakeL.Control.MiniMap = fakeMini;
    fakeL.tileLayer = (url) => ({ url });

    global.L = fakeL;

    const map = { addControl: jest.fn(), removeControl: jest.fn() };
    const layers = [{ url: 'https://example/{z}/{x}/{y}.png' }];
    const config = { MINIMAP: { WIDTH: 120, HEIGHT: 120, ZOOM_LEVEL: 15, AIMING_COLOR: 'blue' }, DEFAULT_ZOOM: 17 };

    const control = initMiniMap(map, layers, config);

    expect(control).toBeTruthy();
    expect(map.addControl).toHaveBeenCalledWith(control);
    expect(control.opts).toBeDefined();
  });

  it('returns null when prerequisites are missing', () => {
    const map = null;
    const layers = [];
    const config = {};
    expect(initMiniMap(map, layers, config)).toBeNull();
  });
});
