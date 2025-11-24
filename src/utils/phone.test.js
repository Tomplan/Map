import normalizePhone from './phone';

describe('normalizePhone', () => {
  it('returns null for empty/undefined', () => {
    expect(normalizePhone(null)).toBeNull();
    expect(normalizePhone(undefined)).toBeNull();
    expect(normalizePhone('')).toBeNull();
  });

  it('normalizes NL local numbers to E.164', () => {
    expect(normalizePhone('0612345678')).toBe('+31612345678');
    expect(normalizePhone('06 123 456 78')).toBe('+31612345678');
    expect(normalizePhone('+31 6 12345678')).toBe('+31612345678');
  });

  it('normalizes international formats', () => {
    expect(normalizePhone('0044 20 7946 0958')).toBe('+442079460958');
    expect(normalizePhone('+1 (415) 555-2671')).toBe('+14155552671');
  });

  it('returns digits fallback when parsing fails', () => {
    const raw = 'abc-123-xyz';
    expect(normalizePhone(raw)).toContain('123');
  });
});
