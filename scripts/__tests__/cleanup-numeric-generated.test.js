let contentTypeForExt, basenameOf, filterNumericCandidates, run;

beforeAll(async () => {
  // storage-js expects a global Response in some node versions — provide a lightweight shim for tests
  if (typeof global.Response === 'undefined') global.Response = class Response {};
  const mod = await import('../cleanup-numeric-generated.js');
  contentTypeForExt = mod.contentTypeForExt;
  basenameOf = mod.basenameOf;
  filterNumericCandidates = mod.filterNumericCandidates;
  run = mod.run;
});

describe('cleanup-numeric-generated helpers', () => {
  test('contentTypeForExt maps extensions correctly', () => {
    expect(contentTypeForExt('.webp')).toBe('image/webp');
    expect(contentTypeForExt('.avif')).toBe('image/avif');
    expect(contentTypeForExt('.png')).toBe('image/png');
    expect(contentTypeForExt('.jpg')).toBe('image/jpeg');
    expect(contentTypeForExt('.jpeg')).toBe('image/jpeg');
    expect(contentTypeForExt('.unknown')).toBe('application/octet-stream');
  });

  test('basenameOf strips extension', () => {
    expect(basenameOf('12345_foo-128.webp')).toBe('12345_foo-128');
    expect(basenameOf('file.png')).toBe('file');
    expect(basenameOf('noext')).toBe('noext');
  });

  test('filterNumericCandidates picks numeric-like basenames', () => {
    const objs = [
      { name: '1762803420948_3cy65g-64.webp' },
      { name: 'slugified-name-128.webp' },
      { name: '12345678.webp' },
      { name: 'normal.png' }
    ];
    const filtered = filterNumericCandidates(objs);
    expect(filtered.length).toBe(2);
    expect(filtered.map(o => o.name)).toEqual(expect.arrayContaining(['1762803420948_3cy65g-64.webp', '12345678.webp']));
  });
});

describe('run flow with mocked supabase client', () => {
  const makeStorage = ({ listData = [], downloadBuffers = {}, uploadResult = { error: null }, removeResult = { data: [], error: null } } = {}) => {
    return {
      storage: {
        from: () => ({
          // return listData as storage.list returns names relative to the requested prefix
          list: async (prefix) => ({ data: listData, error: null }),
          download: async (path) => {
            const buffer = downloadBuffers[path];
            if (!buffer) return { data: null, error: { message: 'not-found' } };
            // return object with arrayBuffer method
            return { data: { arrayBuffer: async () => buffer }, error: null };
          },
          upload: async (toPath, buffer, opts) => uploadResult,
          remove: async (paths) => removeResult
        })
      }
    };
  };

  test('dry-run returns noop when none found', async () => {
    const supabase = makeStorage({ listData: [] });
    const res = await run({ supabaseClient: supabase });
    expect(res.status).toBe('noop');
  });

  test('archive flow uploads then deletes original', async () => {
    const item = { name: '1762803420948_abc-128.webp', size: 1234 };
    const fromPath = `generated/${item.name}`;
    const supabase = makeStorage({ listData: [item], downloadBuffers: { [fromPath]: Buffer.from('ok') }, uploadResult: { error: null }, removeResult: { data: ['ok'], error: null } });

    const res = await run({ supabaseClient: supabase, confirm: true, archiveFlag: true });
    expect(res.status).toBe('archived');
  });

  test('delete-archived dry-run reports found archived candidates and does not delete', async () => {
    const archived = [{ name: '1762803420948_abc-64.webp' }, { name: 'slug-1-64.webp' }];
    const supabase = makeStorage({ listData: [] });
    // override the from.list called for archived listing using custom table
    supabase.storage = { from: () => ({
      list: async (prefix) => ({ data: archived, error: null }),
      remove: async (paths) => ({ data: paths, error: null })
    }) };

    const res = await run({ supabaseClient: supabase, deleteArchivedFlag: true });
    expect(res.status).toBe('dry-run-archived');
    expect(res.candidates).toBeDefined();
  });

  test('delete-archived confirm deletes archived objects', async () => {
    const archived = [{ name: '1762803420948_abc-64.webp' }];
    const supabase = makeStorage({ listData: [] });
    supabase.storage = { from: () => ({
      list: async () => ({ data: archived, error: null }),
      remove: async (paths) => ({ data: paths, error: null })
    }) };

    const res = await run({ supabaseClient: supabase, deleteArchivedFlag: true, confirm: true });
    expect(res.status).toBe('deleted-archived');
  });
});
