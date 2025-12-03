#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import child_process from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOGOS_DIR = path.resolve(path.join(__dirname, '..', 'public', 'assets', 'logos'));
const GENERATED_DIR = path.join(LOGOS_DIR, 'generated');
const BUCKET = 'Logos';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(2);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

// The known missing filenames we detected earlier
const missingFiles = [
  '1762803448156_1756d1.png',
  '1762803399988_po4ce0.png',
  '1762803390274_wsd8xn.webp',
  '1762803412883_eucr4f.png',
  '1762803454469_3p9xpz.jpg',
  '1764017982440_h4cyic.jpeg',
  '1762803420948_3cy65g.png',
  '1762803351448_mfq3ab.jpg',
  '1762803431544_xfrpwe.png',
  '1762803439792_le7fpj.webp'
];

async function downloadCompanyFile(filename) {
  const remotePath = `companies/${filename}`;
  console.log('Downloading', remotePath);
  const { data, error } = await supabase.storage.from(BUCKET).download(remotePath);
  if (error) {
    throw new Error(`Failed to download ${remotePath}: ${error.message || error}`);
  }

  // Write to LOGOS_DIR/<filename>
  const outPath = path.join(LOGOS_DIR, filename);

  // Data may be a ReadableStream or a Buffer/Blob-like; handle common cases
  if (data.arrayBuffer) {
    const ab = await data.arrayBuffer();
    await fs.promises.writeFile(outPath, Buffer.from(ab));
  } else if (data.stream) {
    // Node ReadableStream
    await new Promise((resolve, reject) => {
      const w = fs.createWriteStream(outPath);
      data.stream().pipe(w);
      data.stream().on('error', reject);
      w.on('finish', resolve);
      w.on('error', reject);
    });
  } else if (data instanceof Buffer) {
    await fs.promises.writeFile(outPath, data);
  } else if (data instanceof Uint8Array) {
    await fs.promises.writeFile(outPath, Buffer.from(data));
  } else {
    // try to convert
    try {
      const text = await data.text();
      await fs.promises.writeFile(outPath, text);
    } catch (e) {
      throw new Error(`Unsupported download data type for ${remotePath}: ${String(e)}`);
    }
  }

  console.log('Saved to', outPath);
}

async function ensureDirs() {
  await fs.promises.mkdir(GENERATED_DIR, { recursive: true });
}

function runCommand(cmd, args = []) {
  return new Promise((resolve, reject) => {
    const p = child_process.spawn(cmd, args, { stdio: 'inherit', shell: true });
    p.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} ${args.join(' ')} exited ${code}`))));
    p.on('error', reject);
  });
}

(async function main(){
  try {
    await ensureDirs();

    // 1) Download missing originals into public/assets/logos
    console.log('\n== Downloading originals for missing files ==');
    for (const f of missingFiles) {
      const localPath = path.join(LOGOS_DIR, f);
      if (fs.existsSync(localPath)) {
        console.log('Already exists locally, skipping download:', f);
        continue;
      }
      await downloadCompanyFile(f);
    }

    // 2) Generate variants using the existing optimizer (it processes LOGOS_DIR)
    console.log('\n== Generating variants (webp/avif) ==');
    await runCommand('node', ['scripts/optimize-logos.mjs']);

    // 3) Upload generated variants for the affected basenames
    console.log('\n== Uploading generated variants to Supabase Logos/generated ==');

    function basenameOf(fn) {
      return fn.replace(/\.[^.]+$/, '');
    }

    const basenames = Array.from(new Set(missingFiles.map(basenameOf)));
    const sizes = [64, 128, 256, 512];
    const exts = ['.webp', '.avif'];

    for (const base of basenames) {
      for (const s of sizes) {
        for (const ext of exts) {
          const genName = `${base}-${s}${ext}`;
          const fullPath = path.join(GENERATED_DIR, genName);
          if (!fs.existsSync(fullPath)) {
            console.warn('Generated variant not found locally (skipping upload):', genName);
            continue;
          }

          // Use the repo's upload script to upload single file (it handles content-type and retries)
          console.log('Uploading variant:', genName);
          await runCommand('node', ['scripts/upload-logos.mjs', genName]);
        }
      }
    }

    console.log('\n== Re-running verification ==');
    await runCommand('node', ['scripts/check-generated-vs-plan.mjs']);

    console.log('\nAll done — missing files should be uploaded.');
  } catch (err) {
    console.error('Error:', err.message || err);
    process.exit(1);
  }
})();
