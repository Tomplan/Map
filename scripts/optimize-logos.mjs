#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

// Small reproducible script to generate responsive WebP/AVIF logo variants
// Usage: node scripts/optimize-logos.mjs [--source public/assets/logos] [--out public/assets/logos/generated]

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const argv = process.argv.slice(2);
const getArg = (key, fallback) => {
  const idx = argv.indexOf(key);
  if (idx >= 0 && idx + 1 < argv.length) return argv[idx + 1];
  return fallback;
};

const SOURCE_DIR = path.resolve(getArg('--source', path.join(__dirname, '..', 'public', 'assets', 'logos')));
const OUTPUT_DIR = path.resolve(getArg('--out', path.join(SOURCE_DIR, 'generated')));
const ORIGINALS_DIR = path.resolve(getArg('--backup', path.join(SOURCE_DIR, 'originals')));

const SIZES = [64, 128, 256, 512];
const QUALITY = 80;

async function ensureDir(p) {
  try { await fs.promises.mkdir(p, { recursive: true }); } catch (e) { }
}

function isImageFile(name) {
  const ext = path.extname(name).toLowerCase();
  return ['.png', '.jpg', '.jpeg', '.webp', '.avif', '.svg'].includes(ext);
}

async function generateVariants(file) {
  const filename = path.basename(file);
  const ext = path.extname(filename).toLowerCase();

  // Skip files in generated or originals folders
  if (file.includes(`${path.sep}generated${path.sep}`) || file.includes(`${path.sep}originals${path.sep}`)) return;

  const nameNoExt = filename.replace(/\.[^.]+$/, '');

  const inputBuffer = await fs.promises.readFile(file);

  // For SVG input, keep a copy and rasterize variants
  const isSvg = ext === '.svg';

  for (const w of SIZES) {
    const webpName = `${nameNoExt}-${w}.webp`;
    const avifName = `${nameNoExt}-${w}.avif`;
    const webpPath = path.join(OUTPUT_DIR, webpName);
    const avifPath = path.join(OUTPUT_DIR, avifName);

    try {
      const img = sharp(inputBuffer, { animated: false }).resize({ width: w, fit: 'inside' });
      await img.webp({ quality: QUALITY }).toFile(webpPath);
      await img.avif({ quality: Math.max(50, Math.round(QUALITY * 0.8)) }).toFile(avifPath);
      console.log('[OK]', filename, '->', `${webpName}, ${avifName}`);
    } catch (err) {
      console.error('[ERR] variant generation failed for', filename, err.message || err);
    }
  }
}

async function copyOriginal(file) {
  const dest = path.join(ORIGINALS_DIR, path.basename(file));
  try {
    await fs.promises.copyFile(file, dest);
  } catch (err) {
    // ignore
  }
}

async function run() {
  console.log('Source:', SOURCE_DIR);
  console.log('Output:', OUTPUT_DIR);
  console.log('Backup originals ->', ORIGINALS_DIR);

  await ensureDir(OUTPUT_DIR);
  await ensureDir(ORIGINALS_DIR);

  const names = await fs.promises.readdir(SOURCE_DIR);
  const files = names.map(n => path.join(SOURCE_DIR, n));

  for (const f of files) {
    const stat = await fs.promises.stat(f);
    if (stat.isDirectory()) continue;
    if (!isImageFile(f)) continue;

    // copy original to backup if not already present
    const backupDest = path.join(ORIGINALS_DIR, path.basename(f));
    if (!fs.existsSync(backupDest)) {
      await copyOriginal(f);
    }

    await generateVariants(f);
  }

  console.log('Done.');
}

run().catch((err) => { console.error(err); process.exit(1); });
