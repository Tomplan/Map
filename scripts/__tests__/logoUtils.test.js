import { slugify, looksNumericBase, filenameFromUrl } from '../lib/logoUtils.js';

describe('logoUtils.slugify', () => {
  test('basic slugify', () => {
    expect(slugify('4x4 Vakantie Reizen')).toBe('4x4-vakantie-reizen');
    expect(slugify('  Campingplatz Braunlage GmbH  ')).toBe('campingplatz-braunlage-gmbh');
    expect(slugify('Autobedrijf van der Zweerde')).toBe('autobedrijf-van-der-zweerde');
  });

  test('empty returns untitled', () => {
    expect(slugify('')).toBe('untitled');
    expect(slugify(null)).toBe('untitled');
  });
});

describe('logoUtils.looksNumericBase', () => {
  test('detects numeric-prefixed basenames', () => {
    expect(looksNumericBase('1762803399988_po4ce0')).toBe(true);
    expect(looksNumericBase('1764017982440_h4cyic')).toBe(true);
    expect(looksNumericBase('4wd-travel')).toBe(false);
  });
});

describe('logoUtils.filenameFromUrl', () => {
  test('extracts filename from full url', () => {
    expect(
      filenameFromUrl(
        'https://host/storage/v1/object/public/Logos/generated/1762803399988_po4ce0.png',
      ),
    ).toBe('1762803399988_po4ce0.png');
    expect(filenameFromUrl('assets/logos/fallback.png')).toBe('fallback.png');
  });
});
