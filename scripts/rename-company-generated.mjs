#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import path from 'path';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(2);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

const ids = process.argv.slice(2).filter(a => a !== '--confirm').map(a => parseInt(a, 10)).filter(Boolean);
const confirm = process.argv.includes('--confirm');

// Default to the known set if no ids passed
const DEFAULT_IDS = [2,3,4,5,6,7,8,9,10,21];
const targetIds = ids.length ? ids : DEFAULT_IDS;

import { slugify } from './lib/logoUtils.js';

const SIZES = [64,128,256,512];
const VARIANT_EXTS = ['.webp', '.avif'];
const BUCKET = 'Logos';

  // slugify imported from lib/logoUtils

function cdnBaseUrlFor(fname) {
  const supabaseUrl = url.replace(/\/$/, '');
  return `${supabaseUrl}/storage/v1/object/public/Logos/generated/${encodeURIComponent(fname)}`;
}

async function downloadObject(remotePath) {
  const { data, error } = await supabase.storage.from(BUCKET).download(remotePath);
  if (error) return { error };
  // handle buffer/stream
  if (data.arrayBuffer) {
    const ab = await data.arrayBuffer();
    return { buffer: Buffer.from(ab) };
  } else if (data instanceof Buffer) {
    return { buffer: data };
  } else if (data.stream) {
    // collect stream
    const stream = await data.stream();
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    return { buffer: Buffer.concat(chunks) };
  }
  return { error: new Error('Unknown data type') };
}

function contentTypeForExt(ext) {
  if (!ext) return 'application/octet-stream';
  const e = ext.toLowerCase();
  if (e === '.webp') return 'image/webp';
  if (e === '.avif') return 'image/avif';
  if (e === '.png') return 'image/png';
  if (e === '.jpg' || e === '.jpeg') return 'image/jpeg';
  return 'application/octet-stream';
}

async function run() {
  try {
    // fetch rows
    const { data: rows, error } = await supabase.from('companies').select('id,name,logo').in('id', targetIds);
    if (error) throw error;
    if (!rows || rows.length === 0) {
      console.log('No companies found for ids:', targetIds);
      return;
    }

    const plan = [];

    for (const r of rows) {
      const id = r.id;
      const name = r.name || `company-${id}`;
      const logo = r.logo || '';

      // current filename is last path segment
      const currentFilename = String(logo).split('/').pop();
      if (!currentFilename) {
        console.warn('Skipping (no filename):', id, name);
        continue;
      }

      const curBase = currentFilename.replace(/\.[^.]+$/, '');
      const curExt = path.extname(currentFilename) || '.png';

      // If the base already looks like the slug we want, skip
      const desiredBase = slugify(name) || curBase;

      if (curBase === desiredBase) {
        console.log('Skipping already-sane base for', id, name, curBase);
        continue;
      }

      plan.push({ id, name, currentFilename, curBase, curExt, desiredBase });
    }

    if (plan.length === 0) {
      console.log('No rows to rename. Nothing to do.');
      return;
    }

    // show plan
    console.log('Planned renames / copies:');
    console.table(plan.map(p => ({ id: p.id, name: p.name, from: p.curBase, to: p.desiredBase, ext: p.curExt })));

    if (!confirm) {
      console.log('\nDRY RUN - no changes applied. Re-run with --confirm to apply.');
      return;
    }

    // Apply copying and DB updates
    for (const item of plan) {
      console.log(`\nProcessing company ${item.id} -> ${item.name}`);
      // copy each generated variant (webp + avif) for SIZES
      for (const size of SIZES) {
        for (const ext of VARIANT_EXTS) {
          const srcName = `generated/${item.curBase}-${size}${ext}`;
          const dstName = `generated/${item.desiredBase}-${size}${ext}`;

          // try download
          try {
            const { buffer, error } = await downloadObject(srcName);
            if (error || !buffer) {
              console.warn('  Variant not found, skipping:', srcName);
              continue;
            }

            // upload to dst
            const contentType = contentTypeForExt(ext);
            const up = await supabase.storage.from(BUCKET).upload(dstName, Buffer.from(buffer), { upsert: true, contentType });
            if (up.error) {
              console.error('  Failed to upload copy:', dstName, up.error.message || up.error);
            } else {
              console.log('  Copied', srcName, '->', dstName);
            }
          } catch (err) {
            console.error('  Error copying', srcName, err.message || err);
          }
        }
      }

      // After copying variants, update DB row to generated/<desiredBase><curExt>
      const newFilename = `${item.desiredBase}${item.curExt}`;
      const newCdnUrl = cdnBaseUrlFor(newFilename);

      const upd = await supabase.from('companies').update({ logo: newCdnUrl }).eq('id', item.id);
      if (upd.error) {
        console.error('  DB update failed for', item.id, upd.error.message || upd.error);
      } else {
        console.log('  Updated DB companies', item.id, '->', newCdnUrl);
      }
    }

    console.log('\nAll done.');

  } catch (err) {
    console.error('Error:', err.message || err);
    process.exit(1);
  }
}

run();
