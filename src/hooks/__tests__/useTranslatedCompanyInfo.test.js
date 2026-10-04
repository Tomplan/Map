import { getSpecialMarkerText, getTranslatedInfo } from '../useTranslatedCompanyInfo';

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

describe('getSpecialMarkerText', () => {
  const marker = {
    id: 1001,
    name: 'Niederländischer Titel',
    name_en: 'English title',
    name_de: 'Deutscher Titel',
    info: 'Nederlandse tekst',
    info_en: 'English text',
    info_de: 'Deutscher Text',
  };

  test('returns the requested special-marker translation', () => {
    expect(getSpecialMarkerText(marker, 'name', 'en')).toBe('English title');
    expect(getSpecialMarkerText(marker, 'info', 'de')).toBe('Deutscher Text');
  });

  test('falls back to the base Dutch field when a translation is missing', () => {
    expect(getSpecialMarkerText({ name: 'Nederlandse titel' }, 'name', 'de')).toBe(
      'Nederlandse titel',
    );
  });
});
