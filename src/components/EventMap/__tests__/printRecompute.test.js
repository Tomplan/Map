// The recomputePrintMarkerIcons feature was experimental and caused visual regressions
// in production. It has been rolled back. This test file is intentionally skipped until
// the feature is reintroduced behind a guarded flag and accompanied by robust E2E
// visual tests to validate printed marker sizing across UI zooms.

describe('recomputePrintMarkerIcons (disabled)', () => {
  it.skip('disabled: experimental recomputePrintMarkerIcons test (rollback)', () => {
    // intentionally skipped
  });
});
