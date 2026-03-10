import { parseSpatialInvoice } from '../pdfParser';

describe('parseSpatialInvoice helper', () => {
  it('splits area after slash into separate field', () => {
    const items = [
      { str: 'Widget / Area1', x: 0, y: 0, height: 0, width: 0 },
      { str: '2', x: 250, y: 0, height: 0, width: 0 },
    ];
    const result = parseSpatialInvoice(items, []);
    expect(result.line_items.length).toBe(1);
    expect(result.line_items[0].item).toBe('Widget');
    expect(result.line_items[0].area).toBe('Area1');
  });

  it('stores notes from opmerkingen block into notes property', () => {
    const items = [
      { str: 'Opmerkingen: please check', x: 0, y: 0, height: 0, width: 0 },
    ];
    const result = parseSpatialInvoice(items, []);
    expect(result.notes).toBe('please check');
  });
});
