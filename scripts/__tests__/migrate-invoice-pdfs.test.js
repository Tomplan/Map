let buildPlan, storageNameFor, run;

beforeAll(async () => {
  if (typeof global.Response === 'undefined') global.Response = class Response {};
  const mod = await import('../invoices/migrate-pdfs-to-storage.js');
  buildPlan = mod.buildPlan;
  storageNameFor = mod.storageNameFor;
  run = mod.run;
});

describe('storageNameFor', () => {
  test('matches the upload service naming (unsafe characters replaced)', () => {
    expect(storageNameFor('2024001')).toBe('2024001.pdf');
    expect(storageNameFor('2024/001 a')).toBe('2024_001_a.pdf');
  });
});

describe('buildPlan', () => {
  const files = ['2024001.pdf', '2024002.pdf', '2024003.pdf', 'notes.txt'];

  test('splits uploads, existing objects, links and orphans', () => {
    const rows = [
      { invoice_number: '2024001', pdf_path: null },
      { invoice_number: '2024002', pdf_path: '2024002.pdf' },
      { invoice_number: '2099999', pdf_path: null },
    ];
    const plan = buildPlan({ files, rows, existingNames: ['2024003.pdf'] });

    expect(plan.upload.map((u) => u.name)).toEqual(['2024001.pdf', '2024002.pdf']);
    expect(plan.alreadyInBucket.map((u) => u.name)).toEqual(['2024003.pdf']);
    expect(plan.link).toEqual([{ invoice_number: '2024001', pdf_path: '2024001.pdf' }]);
    expect(plan.rowsWithoutPdf).toEqual(['2099999']);
    expect(plan.filesWithoutRow).toEqual(['2024003']);
  });

  test('ignores non-PDF files', () => {
    const plan = buildPlan({ files: ['readme.md'], rows: [], existingNames: [] });
    expect(plan.upload).toEqual([]);
  });
});

describe('run', () => {
  const makeSupabase = ({ uploadError } = {}) => {
    const calls = { uploads: [], updates: [] };
    const table = {
      select: () => table,
      order: () => table,
      range: () =>
        Promise.resolve({
          data: [
            { invoice_number: '2024001', pdf_path: null },
            { invoice_number: '2024002', pdf_path: null },
          ],
          error: null,
        }),
      update: (values) => {
        const call = { values };
        calls.updates.push(call);
        const chain = {
          eq: (col, val) => {
            call.eq = [col, val];
            return chain;
          },
          is: () => Promise.resolve({ error: null }),
        };
        return chain;
      },
    };
    const supabase = {
      from: () => table,
      storage: {
        from: () => ({
          list: () => Promise.resolve({ data: [], error: null }),
          upload: (name) => {
            calls.uploads.push(name);
            return Promise.resolve({
              error: uploadError && name === '2024002.pdf' ? { message: 'boom' } : null,
            });
          },
        }),
      },
    };
    return { supabase, calls };
  };

  const base = {
    dir: 'pdfs',
    listDir: () => ['2024001.pdf', '2024002.pdf'],
    readFile: () => Buffer.from('%PDF'),
    log: () => {},
  };

  test('dry run changes nothing', async () => {
    const { supabase, calls } = makeSupabase();
    const summary = await run({ ...base, supabase });
    expect(calls.uploads).toEqual([]);
    expect(calls.updates).toEqual([]);
    expect(summary.upload).toHaveLength(2);
  });

  test('--confirm uploads and links the rows', async () => {
    const { supabase, calls } = makeSupabase();
    const summary = await run({ ...base, supabase, confirm: true });
    expect(calls.uploads).toEqual(['2024001.pdf', '2024002.pdf']);
    expect(calls.updates.map((u) => u.values.pdf_path)).toEqual(['2024001.pdf', '2024002.pdf']);
    expect(summary.uploaded).toBe(2);
    expect(summary.linked).toBe(2);
  });

  test('does not link a row whose upload failed', async () => {
    const { supabase, calls } = makeSupabase({ uploadError: true });
    const summary = await run({ ...base, supabase, confirm: true });
    expect(summary.uploadErrors).toEqual([{ file: '2024002.pdf', error: 'boom' }]);
    expect(calls.updates.map((u) => u.values.pdf_path)).toEqual(['2024001.pdf']);
  });
});
