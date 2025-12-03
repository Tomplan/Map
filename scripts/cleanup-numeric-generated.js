#!/usr/bin/env node
/**
 * Cleanup numeric-generated objects from Supabase storage (common .js module)
 */

// delay importing createClient until runtime (keeps module test-friendly)
import { looksNumericBase } from './lib/logoUtils.js';

export const BUCKET = 'Logos';

export function contentTypeForExt(ext) {
  if (!ext) return 'application/octet-stream';
  const e = ext.toLowerCase();
  if (e === '.webp') return 'image/webp';
  if (e === '.avif') return 'image/avif';
  if (e === '.png') return 'image/png';
  if (e === '.jpg' || e === '.jpeg') return 'image/jpeg';
  return 'application/octet-stream';
}

export function basenameOf(name) {
  return String(name || '').replace(/\.[^.]+$/, '');
}

export function filterNumericCandidates(objects) {
  return (objects || []).filter(o => looksNumericBase(basenameOf(o.name)));
}

export async function listGeneratedObjects(supabase, prefix = 'generated/', limit = 2000) {
  const { data, error } = await supabase.storage.from(BUCKET).list(prefix, { limit });
  if (error) throw error;
  return data || [];
}

async function downloadToBuffer(downloadResult) {
  if (!downloadResult) throw new Error('missing download result');
  if (downloadResult.arrayBuffer) {
    const ab = await downloadResult.arrayBuffer();
    return Buffer.from(ab);
  }
  if (downloadResult.stream) {
    try {
      const stream = await downloadResult.stream();
      const chunks = [];
      for await (const c of stream) chunks.push(c);
      return Buffer.concat(chunks);
    } catch (err) {
      throw new Error('unsupported download type for stream');
    }
  }
  if (downloadResult instanceof Buffer) return downloadResult;
  throw new Error('unsupported download type');
}

export async function run(opts = {}) {
  const {
    supabaseClient,
    confirm = false,
    archiveFlag = false,
    deleteArchivedFlag = false,
    prefix = undefined
  } = opts;

  if (!supabaseClient) throw new Error('supabaseClient required');

  const listPrefix = deleteArchivedFlag ? 'generated/archived/' : (prefix || 'generated/');

  console.log(`Listing ${listPrefix} objects from Supabase (dry-run unless --confirm provided)`);

  const objects = await listGeneratedObjects(supabaseClient, listPrefix);
  const candidates = filterNumericCandidates(objects);

  if (!candidates.length) {
    console.log('No numeric-generated objects found. Nothing to do.');
    return { status: 'noop', candidates: [] };
  }

  console.log(`Found ${candidates.length} numeric-generated objects:`);
  candidates.forEach(o => console.log(' -', o.name, `(${o.size || 'n/a'} bytes)`));

  if (!confirm) {
    console.log('\nDry run: no changes applied. Re-run with --confirm to apply.');
    console.log('You may pass --archive to move objects into generated/archived/ instead of permanent delete.');
    if (deleteArchivedFlag) return { status: 'dry-run-archived', candidates };
    return { status: 'dry-run', candidates };
  }

  if (archiveFlag) {
    for (const o of candidates) {
      const fromPath = `${listPrefix}${o.name}`;
      const toPath = `generated/archived/${o.name}`;
      console.log('Archiving', fromPath, '->', toPath);

      const { data: downloadData, error: downloadErr } = await supabaseClient.storage.from(BUCKET).download(fromPath);
      if (downloadErr) {
        console.error('  failed to download', fromPath, downloadErr.message || downloadErr);
        continue;
      }

      let buffer;
      try {
        buffer = await downloadToBuffer(downloadData);
      } catch (err) {
        console.error('  failed to convert download to buffer for', fromPath, err.message || err);
        continue;
      }

      const ext = toPath.slice(((toPath.lastIndexOf('.') + 1) || 0) - 1);
      const put = await supabaseClient.storage.from(BUCKET).upload(
        toPath,
        buffer,
        { upsert: true, contentType: contentTypeForExt(ext) }
      );

      if (put.error) {
        console.error('  failed to upload archive', toPath, put.error.message || put.error);
        continue;
      }

      console.log('  archived', o.name);
      const del = await supabaseClient.storage.from(BUCKET).remove([fromPath]);
      if (del.error) console.error('  failed to delete original', fromPath, del.error.message || del.error);
      else console.log('  deleted original', fromPath);
    }

    console.log('Archiving complete.');
    return { status: 'archived', candidates };
  }

  if (deleteArchivedFlag) {
    const { data: archived, error: listErr } = await supabaseClient.storage.from(BUCKET).list('generated/archived', { limit: 2000 });
    if (listErr) {
      console.error('Failed to list archived objects:', listErr.message || listErr);
      return { status: 'error', error: listErr };
    }

    const archivedCandidates = (archived || []).filter(a => looksNumericBase(basenameOf(a.name)));
    if (!archivedCandidates.length) {
      console.log('No numeric-archived objects found. Nothing to do.');
      return { status: 'noop-archived', candidates: [] };
    }

    console.log(`Found ${archivedCandidates.length} numeric-archived objects:`);
    archivedCandidates.forEach(o => console.log(' -', o.name));

    if (!confirm) {
      console.log('\nDry run for archived: no changes applied. Re-run with --confirm --delete-archived to apply.');
      return { status: 'dry-run-archived', candidates: archivedCandidates };
    }

    const pathsToDelete = archivedCandidates.map(o => `generated/archived/${o.name}`);
    console.log('\nDeleting archived numeric-generated objects (permanent)');
    const { data: removedArchived, error: remArchErr } = await supabaseClient.storage.from(BUCKET).remove(pathsToDelete);
    if (remArchErr) {
      console.error('Failed to remove archived objects:', remArchErr.message || remArchErr);
      return { status: 'error', error: remArchErr };
    }

    console.log('Removed archived objects:', removedArchived || []);
    return { status: 'deleted-archived', removed: removedArchived };
  }

  console.log('\nDeleting numeric-generated objects (permanent)');
  const paths = candidates.map(o => `${listPrefix}${o.name}`);
  const { data: removed, error: remErr } = await supabaseClient.storage.from(BUCKET).remove(paths);
  if (remErr) {
    console.error('Delete failed:', remErr.message || remErr);
    return { status: 'error', error: remErr };
  }

  console.log('Removed objects:', removed || []);
  return { status: 'deleted', removed };
}

// CLI entrypoint compatibility
if (typeof process !== 'undefined' && process.argv) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    if (process.env.JEST_WORKER_ID === undefined) process.exit(2);
  } else {
    // When running under Jest we don't want the CLI logic to execute (env keys may be present in CI/test env)
    // Only run CLI dynamic import when NOT running under jest
    if (process.env.JEST_WORKER_ID === undefined) {
      // import dynamically so module doesn't require @supabase during tests
      import('@supabase/supabase-js').then(({ createClient }) => {
      const supabase = createClient(url, key, { auth: { persistSession: false } });
      const confirm = process.argv.includes('--confirm');
      const archiveFlag = process.argv.includes('--archive');
      const deleteArchivedFlag = process.argv.includes('--delete-archived');
      run({ supabaseClient: supabase, confirm, archiveFlag, deleteArchivedFlag }).catch(e => {
        console.error('Run failed', e.message || e);
        process.exit(1);
      });
      }).catch(e => {
        console.error('Failed to import supabase client', e.message || e);
        process.exit(1);
      });
    }
  }
}
