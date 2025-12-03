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

  // Friendly validation with actionable log messages for CI
  function mask(value, visible = 12) {
    if (!value) return '<unset>';
    if (value.length <= visible) return '***MASKED***';
    return `${value.slice(0, visible)}...***`;
  }

  function validateSupabaseUrl(supabaseUrl) {
    if (!supabaseUrl) return 'SUPABASE_URL is unset';
    if (!/^https?:\/\//i.test(supabaseUrl)) return 'SUPABASE_URL must start with http:// or https://';
    try {
      const u = new URL(supabaseUrl);
      if (!u.hostname.includes('supabase.co')) {
        return 'SUPABASE_URL hostname does not look like a Supabase project URL (should include .supabase.co)';
      }
    } catch (err) {
      return `SUPABASE_URL is not a valid URL: ${String(err.message)}`;
    }
    return null;
  }

  const urlFailure = validateSupabaseUrl(url);
  if (urlFailure) {
    console.error('Supabase configuration error:', urlFailure);
    console.error('Value of SUPABASE_URL (masked) =>', mask(url));
    console.error('Please set the GitHub repository secret SUPABASE_URL to the full project URL, e.g. https://<project>.supabase.co');
    process.exit(2);
  }

  if (!key) {
    console.error('Supabase configuration error: SUPABASE_SERVICE_ROLE_KEY is unset');
    console.error('Make sure you added the SUPABASE_SERVICE_ROLE_KEY secret to the workflow or repository secrets.');
    process.exit(2);
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });

  // Walk generated dir
  let files = fs.readdirSync(GENERATED_DIR).filter(f => !f.startsWith('.'));

  // Allow quick single-file testing: pass a filename as argv[2]
  const single = process.argv[2];
  if (single) {
    if (!files.includes(single)) {
      console.error('Requested test file not found in generated directory:', single);
      process.exit(3);
    }
    files = [single];
  }

  console.log(`Found ${files.length} files to upload`);

  let successCount = 0;
  let failCount = 0;

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

    // Use a Buffer rather than a ReadStream so Supabase SDK can honor contentType
    // and the underlying fetch does not default to text/plain;charset=UTF-8
    const body = fs.readFileSync(localPath);
    const ext = path.extname(localPath).toLowerCase();
    const extToMime = {
      '.webp': 'image/webp',
      '.avif': 'image/avif',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.svg': 'image/svg+xml',
      '.gif': 'image/gif'
    };
    const contentType = extToMime[ext] || 'application/octet-stream';

    console.log('Uploading', file, '->', remotePath, 'contentType=', contentType);

    // Wrap the Buffer into a Blob so the underlying HTTP request sets the
    // Content-Type header properly. Node >=18 provides a global Blob implementation
    // which the Supabase client will use to set the request headers.
    let payload = body;
    try {
      if (typeof Blob !== 'undefined') {
        payload = new Blob([body], { type: contentType });
      }
    } catch (err) {
      // ignore blob creation failure; fallback to raw buffer
    }

    // Try uploading using the REST endpoint directly (PUT) so we can ensure the
    // Content-Type header is set correctly. This avoids ambiguous behavior from
    // Node streams or Blob handling in some runtimes.
    const uploadUrlPath = [
      url.replace(/^https?:\/\//, ''),
      'storage/v1/object',
      BUCKET,
      ...remotePath.split('/').map(p => encodeURIComponent(p))
    ].join('/');
    // Full URL: <SUPABASE_URL>/storage/v1/object/<BUCKET>/<path>?upsert=true
    const fullUploadUrl = `${url.replace(/\/$/, '')}/storage/v1/object/${BUCKET}/${remotePath.split('/').map(encodeURIComponent).join('/') }?upsert=true`;

    let attempts = 0;
    let ok = false;
    let lastRespText = null;
    while (attempts < 3 && !ok) {
      attempts += 1;
      try {
        const headersToSend = {
          Authorization: `Bearer ${key}`,
          'Content-Type': contentType,
          'x-upsert': 'true'
        };

        // Masked debug output so CI logs show what we send without leaking the key
        console.log('DEBUG: sending headers (masked):', {
          Authorization: 'Bearer ***',
          'Content-Type': headersToSend['Content-Type'],
          'x-upsert': headersToSend['x-upsert']
        });

        const res = await fetch(fullUploadUrl, {
          method: 'PUT',
          headers: headersToSend,
          body: payload
        });

        if (!res.ok) {
          lastRespText = await res.text();
          console.error(`Attempt ${attempts} failed for ${file}: status=${res.status} body=${lastRespText}`);
          console.error('DEBUG: response headers:', Object.fromEntries(res.headers.entries()));
          await new Promise(r => setTimeout(r, 200 * attempts));
          continue;
        }

        console.log('Uploaded:', file);
        ok = true;
      } catch (err) {
        lastRespText = String(err);
        console.error(`Attempt ${attempts} failed for ${file}: ${lastRespText}`);
        console.error('DEBUG: fetch error; headers were (masked):', { 'Content-Type': contentType });
        await new Promise(r => setTimeout(r, 200 * attempts));
      }
    }

    if (!ok) {
      console.error('Upload failed for', file, '-', lastRespText || 'unknown error');
      failCount += 1;
    }
    else {
      successCount += 1;
    }
  }

  console.log('\nUpload complete —', successCount, 'uploaded,', failCount, 'failed');

  if (successCount > 0) {
    console.log('You can check a sample public URL (if objects are public):');
    const sample = files.find(Boolean);
    if (sample) {
      const sampleRemote = `generated/${sample}`;
      console.log(`${url.replace(/\/$/, '')}/storage/v1/object/public/${BUCKET}/${sampleRemote}`);
    }
  }
}

main().catch(err => { console.error(err); process.exit(1); });
