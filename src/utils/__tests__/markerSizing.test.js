import { getIconSizeForZoom, getScaleBetweenZooms } from '../markerSizing';

// Mock the config import which uses import.meta and can break jest's parsing
jest.mock('../../config/mapConfig', () => ({
  MAP_CONFIG: {
    MARKER_SIZING: {
      ENABLED: true,
      SPECIAL_MARKER_MULTIPLIER: 1.2,
      ZOOM_BUCKETS: [
        { minZoom: 14.0, maxZoom: 17.99, size: [8, 13.33] },
        { minZoom: 18.0, maxZoom: 19.49, size: [15, 25] },
        { minZoom: 19.5, maxZoom: 22.0, size: [20, 33.33] },
      ],
      DEFAULT_SIZE: [25, 41],
    },
  },
}));

describe('getIconSizeForZoom', () => {
  test('returns bucket size unchanged when base size equals config default', () => {
    const zoom = 16; // falls into first bucket (14.0 - 17.99)
    const baseSize = [25, 41]; // reference default size used in config
    const size = getIconSizeForZoom(zoom, baseSize, false, false);
    // expected to be bucket.size scaled by 1 -> [8, ~13.33] -> rounded
    expect(size).toEqual([8, 13]);
  });

  test('scales bucket size proportionally to marker base size', () => {
    const zoom = 16; // first bucket
    const baseSize = [50, 82]; // double height compared to default (82 vs 41)
    const size = getIconSizeForZoom(zoom, baseSize, false, false);

    // bucket size for first bucket: [8, 13.33]
    // scale factor = 82 / 41 = 2
    // scaled size = [16, 26.66] -> rounded to [16, 27]
    expect(size).toEqual([16, 27]);
  });

  test('getScaleBetweenZooms returns ratio between widths', () => {
    const baseZoom = 16; // bucket 1
    const targetZoom = 18.5; // bucket 2
    const baseSize = [25, 41];
    const ratio = getScaleBetweenZooms(baseZoom, targetZoom, baseSize, false, false);
    // bucket widths: at baseZoom=16 => 8; at targetZoom=18.5 => 15
    expect(ratio).toBeCloseTo(15 / 8, 5);
  });
});
