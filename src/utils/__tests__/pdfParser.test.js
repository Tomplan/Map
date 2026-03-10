import { parseSpatialInvoice } from '../pdfParser';

describe('parseSpatialInvoice helper', () => {
  it('splits area after slash into separate field', () => {
    const items = [
      // header row to trigger inLineItems
      { str: 'Item aantal', x: 0, y: 10, height: 0, width: 0 },
      // actual line item below
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
    expect(result.opmerkingen).toBe(result.notes);
  });

  it('handles singular "Opmerking" and collects following lines', () => {
    const items = [
      { str: 'Opmerking: first line', x: 0, y: 10, height: 0, width: 0 },
      { str: 'second line continues', x: 0, y: 5, height: 0, width: 0 },
      { str: 'Totale bedrag', x: 0, y: 0, height: 0, width: 0 }, // should stop accumulation
    ];
    const result = parseSpatialInvoice(items, []);
    expect(result.notes).toBe('first line second line continues');
    expect(result.opmerkingen).toBe(result.notes);
  });

  it('ignores subsequent bank/IBAN-style lines after notes', () => {
    const items = [
      { str: 'Opmerking: some note', x: 0, y: 10, height: 0, width: 0 },
      { str: 'additional info', x: 0, y: 5, height: 0, width: 0 },
      { str: '12345678 NL123456789B01', x: 0, y: 0, height: 0, width: 0 },
    ];
    const result = parseSpatialInvoice(items, []);
    expect(result.notes).toBe('some note additional info');
    expect(result.opmerkingen).toBe(result.notes);
  });
});
