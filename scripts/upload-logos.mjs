#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

// Upload generated logo assets to Supabase Storage
// Requires environment variables:
// SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GENERATED_DIR = path.resolve(path.join(__dirname, '..', 'public', 'assets', 'logos', 'generated'));
const BUCKET = 'Logos';

async function main() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars. Aborting.');
    process.exit(2);
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });

  // Walk generated dir
  const files = fs.readdirSync(GENERATED_DIR).filter(f => !f.startsWith('.'));

  console.log(`Found ${files.length} files to upload`);

  for (const file of files) {
    const localPath = path.join(GENERATED_DIR, file);
    const stat = fs.statSync(localPath);
    if (!stat.isFile()) continue;

    // Upload to bucket under 'generated/' path
    const remotePath = `generated/${file}`;

    // Check if already exists
    try {
      const { data: head } = await supabase.storage.from(BUCKET).getPublicUrl(remotePath);
      // Not a reliable check; we just attempt upload (upsert true)
    } catch (e) {
      // continue
    }

    const body = fs.createReadStream(localPath);
    console.log('Uploading', file, '->', remotePath);

    const { data, error } = await supabase.storage.from(BUCKET).upload(remotePath, body, {
      cacheControl: 'public, max-age=31536000, immutable',
      upsert: true
    });

    if (error) {
      console.error('Upload failed for', file, error.message || error);
    } else {
      console.log('Uploaded:', file);
    }
  }

  console.log('Done');
}

main().catch(err => { console.error(err); process.exit(1); });
