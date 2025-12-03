#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOGOS_DIR = path.resolve(path.join(__dirname, '..', 'public', 'assets', 'logos'));
const GENERATED_DIR = path.join(LOGOS_DIR, 'generated');

const SIZES = [128]; // ensure minimal variant exists

async function run() {
  if (!fs.existsSync(GENERATED_DIR)) {
    console.error('Missing generated folder:', GENERATED_DIR);
    process.exit(2);
  }

  const names = fs.readdirSync(LOGOS_DIR).filter(n => fs.statSync(path.join(LOGOS_DIR, n)).isFile());
  let missing = [];
  for (const name of names) {
    const ext = path.extname(name).toLowerCase();
    if (!['.png', '.jpg', '.jpeg', '.gif', '.webp', '.avif', '.svg'].includes(ext)) continue;
    const base = name.replace(/\.[^.]+$/, '');
    for (const s of SIZES) {
      const expected = `${base}-${s}.webp`;
      if (!fs.existsSync(path.join(GENERATED_DIR, expected))) {
        missing.push(expected);
      }
    }
  }

  if (missing.length) {
    console.error('Missing generated logo variants:', missing.slice(0, 20));
    process.exit(1);
  }

  console.log('All checks passed — found generated logo variants.');
}

run().catch(err => { console.error(err); process.exit(3); });
