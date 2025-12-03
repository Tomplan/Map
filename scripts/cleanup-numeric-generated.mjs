#!/usr/bin/env node
/**
 * Cleanup numeric-generated objects from Supabase storage
 *
 * Dry run (no changes):
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/cleanup-numeric-generated.mjs
 *
 * Archive instead of delete (dry-run):
 *   node scripts/cleanup-numeric-generated.mjs --archive
 *
 * Apply deletions (destructive):
 *   node scripts/cleanup-numeric-generated.mjs --confirm
 *
 * Apply archiving (safe removal):
 *   node scripts/cleanup-numeric-generated.mjs --confirm --archive
 */

import { createClient } from '@supabase/supabase-js';
import { looksNumericBase } from './lib/logoUtils.js';

function contentTypeForExt(ext) {
  if (!ext) return 'application/octet-stream';
  const e = ext.toLowerCase();
  if (e === '.webp') return 'image/webp';
  if (e === '.avif') return 'image/avif';
  if (e === '.png') return 'image/png';
  if (e === '.jpg' || e === '.jpeg') return 'image/jpeg';
  return 'application/octet-stream';
}

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(2);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });
const confirm = process.argv.includes('--confirm');
const archiveFlag = process.argv.includes('--archive');
const BUCKET = 'Logos';

async function listGeneratedObjects(prefix = 'generated/', limit = 2000) {
  const { data, error } = await supabase.storage.from(BUCKET).list(prefix, { limit });
  if (error) throw error;
  return data || [];
}

function basenameOf(name) {
  return name.replace(/\.[^.]+$/, '');
}

async function run() {
  console.log('Listing generated/ objects from Supabase (dry-run unless --confirm provided)');
  try {
    const objects = await listGeneratedObjects();

    // Filter numeric-ish basenames
    const candidates = objects.filter(o => looksNumericBase(basenameOf(o.name)));

    if (!candidates.length) {
      console.log('No numeric-generated objects found. Nothing to do.');
      return;
    }

    console.log(`Found ${candidates.length} numeric-generated objects:`);
    candidates.forEach(o => console.log(' -', o.name, `(${o.size || 'n/a'} bytes)`));

    if (!confirm) {
      console.log('\nDry run: no changes applied. Re-run with --confirm to apply.');
      console.log('You may pass --archive to move objects into generated/archived/ instead of permanent delete.');
      return;
    }

    if (archiveFlag) {
      console.log('\nArchiving numeric-generated objects to generated/archived/ (upsert)');
      for (const o of candidates) {
        const fromPath = `generated/${o.name}`;
        const toPath = `generated/archived/${o.name}`;
        console.log('Archiving', fromPath, '->', toPath);
        // download object
        const { data, error } = await supabase.storage.from(BUCKET).download(fromPath);
        if (error) {
          console.error('  failed to download', fromPath, error.message || error);
          continue;
        }

        // convert to buffer
        let buffer;
        if (data.arrayBuffer) {
          const ab = await data.arrayBuffer();
          buffer = Buffer.from(ab);
        } else if (data instanceof Buffer) buffer = data; else {
          try {
            const stream = await data.stream();
            const chunks = [];
            for await (const c of stream) chunks.push(c);
            buffer = Buffer.concat(chunks);
          } catch (e) {
            console.error('  unsupported download type for', fromPath, e.message || e);
            continue;
          }
        }

        // upload to archived path with upsert
        const ext = toPath.slice(((toPath.lastIndexOf('.') + 1) || 0) - 1);
        const put = await supabase.storage.from(BUCKET).upload(
          toPath,
          buffer,
          { upsert: true, contentType: contentTypeForExt(ext) }
        );

        if (put.error) {
          console.error('  failed to upload archive', toPath, put.error.message || put.error);
        } else {
          console.log('  archived', o.name);
          // delete original
          const del = await supabase.storage.from(BUCKET).remove([fromPath]);
          if (del.error) console.error('  failed to delete original', fromPath, del.error.message || del.error);
          else console.log('  deleted original', fromPath);
        }
      }
      console.log('Archiving complete.');
      return;
    }

    // Otherwise, delete permanently
    console.log('\nDeleting numeric-generated objects (permanent)');
    const paths = candidates.map(o => `generated/${o.name}`);
    // Supabase remove expects array of paths
    const { data: removed, error: remErr } = await supabase.storage.from(BUCKET).remove(paths);
    if (remErr) {
      console.error('Delete failed:', remErr.message || remErr);
    } else {
      console.log('Removed objects:', removed || []);
    }
  } catch (err) {
    console.error('Error during cleanup:', err.message || err);
    process.exit(1);
  }
}

run();
