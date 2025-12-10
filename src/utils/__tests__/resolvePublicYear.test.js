import resolvePublicYear from '../resolvePublicYear';

describe('resolvePublicYear', () => {
  it('returns public_default_year when present', () => {
    expect(resolvePublicYear(2026, { public_default_year: 2025 })).toBe(2025);
  });

  it('falls back to selectedYear when public_default_year is null', () => {
    expect(resolvePublicYear(2026, { public_default_year: null })).toBe(2026);
  });

  it('falls back to selectedYear when orgSettings is null', () => {
    expect(resolvePublicYear(2026, null)).toBe(2026);
  });
});
