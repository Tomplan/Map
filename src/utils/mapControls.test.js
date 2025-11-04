import { handleZoomIn, handleZoomOut, handleHome, handleCustomSearchClick } from './mapControls';

describe('mapControls', () => {
  it('handleZoomIn calls zoomIn on mapInstance', () => {
    const map = { zoomIn: jest.fn() };
    handleZoomIn(map);
    expect(map.zoomIn).toHaveBeenCalled();
  });

  it('handleZoomOut calls zoomOut on mapInstance', () => {
    const map = { zoomOut: jest.fn() };
    handleZoomOut(map);
    expect(map.zoomOut).toHaveBeenCalled();
  });

  it('handleHome sets view on mapInstance', () => {
    const map = { setView: jest.fn() };
    handleHome(map, [1, 2], 10);
    expect(map.setView).toHaveBeenCalledWith([1, 2], 10);
  });

  it('handleCustomSearchClick expands and focuses search', () => {
    const expand = jest.fn();
    const ref = { current: { expand } };
    handleCustomSearchClick(ref);
    expect(expand).toHaveBeenCalled();
  });
});
