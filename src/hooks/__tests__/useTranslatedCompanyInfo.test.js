import { getTranslatedInfo } from '../useTranslatedCompanyInfo';

describe('getTranslatedInfo', () => {
  test('returns the requested language when present', () => {
    const translations = [
      { language_code: 'nl', info: 'Nederlandse tekst' },
      { language_code: 'en', info: 'English text' },
    ];

    expect(getTranslatedInfo(translations, 'en')).toBe('English text');
  });

  test('does not fall back to Dutch for missing English', () => {
    const translations = [{ language_code: 'nl', info: 'Nederlandse tekst' }];

    expect(getTranslatedInfo(translations, 'en')).toBe('');
  });

  test('falls back to Dutch for missing German', () => {
    const translations = [{ language_code: 'nl', info: 'Nederlandse tekst' }];

    expect(getTranslatedInfo(translations, 'de')).toBe('Nederlandse tekst');
  });

  test('returns German company info when it is available', () => {
    const translations = [
      { language_code: 'nl', info: 'Nederlandse tekst' },
      { language_code: 'de', info: 'Deutscher Text' },
    ];

    expect(getTranslatedInfo(translations, 'de')).toBe('Deutscher Text');
  });

  test('still falls back to deprecated legacy info when Dutch is requested', () => {
    expect(getTranslatedInfo([], 'nl', 'Legacy Dutch info')).toBe('Legacy Dutch info');
  });
});
