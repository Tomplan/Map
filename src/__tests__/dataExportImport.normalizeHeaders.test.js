import { normalizeHeaderName, resolveHeaderValue } from '../utils/dataExportImport';

describe('Header normalization helpers', () => {
  test('normalizeHeaderName trims, lowercases and removes punctuation', () => {
    expect(normalizeHeaderName(' Info (Nederlands) ')).toBe('info nederlands');
    expect(normalizeHeaderName('Company Name')).toBe('company name');
    expect(normalizeHeaderName('Info (EN)')).toBe('info en');
  });

  test('resolveHeaderValue returns value for canonical and variant headers', () => {
    const row = {
      'Company Name ': 'Acme',
      'Info NL': 'NL text',
      'Info (EN)': 'EN text',
      'info_de': 'DE text',
    };

    expect(resolveHeaderValue(row, ['Company Name', 'Name'])).toBe('Acme');
    expect(resolveHeaderValue(row, ['Info (Nederlands)', 'Info NL'])).toBe('NL text');
    expect(resolveHeaderValue(row, ['Info (English)', 'Info EN'])).toBe('EN text');
    expect(resolveHeaderValue(row, ['Info (Deutsch)', 'Info DE'])).toBe('DE text');
  });
});