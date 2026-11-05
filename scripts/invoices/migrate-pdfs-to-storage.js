/**
 * One-off migration: copy the legacy invoice PDFs from public/invoices into the PRIVATE
 * Supabase Storage bucket "invoices" and set staged_invoices.pdf_path for the matching rows.
 *
 * Run migration 053 first. Logs in as an admin (VITE_ADMIN_EMAIL / VITE_ADMIN_PASSWORD in
 * .env.local) so the storage and table RLS policies apply; no service key is needed.
 *
 *   node scripts/invoices/migrate-pdfs-to-storage.js            # dry run (default)
 *   node scripts/invoices/migrate-pdfs-to-storage.js --confirm  # upload + link
 *   node scripts/invoices/migrate-pdfs-to-storage.js --dir path/to/pdfs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

export const BUCKET = 'invoices';
const PAGE_SIZE = 1000;

// Must match the file naming in src/services/invoicePdfUploadService.js
export const storageNameFor = (invoiceNumber) =>
  `${String(invoiceNumber).replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;

/**
 * @param {string[]} files - local file names, e.g. ['2024001.pdf']
 * @param {{invoice_number: string, pdf_path: string|null}[]} rows - staged_invoices rows
 * @param {string[]} existingNames - object names already in the bucket
 */
export function buildPlan({ files, rows, existingNames }) {
  const pdfFiles = files.filter((f) => f.toLowerCase().endsWith('.pdf'));
  const localByNumber = new Map(pdfFiles.map((f) => [path.basename(f, path.extname(f)), f]));
  const rowNumbers = new Set(rows.map((r) => r.invoice_number));
  const inBucket = new Set(existingNames);

  const upload = [];
  const alreadyInBucket = [];
  for (const [number, file] of localByNumber) {
    const name = storageNameFor(number);
    (inBucket.has(name) ? alreadyInBucket : upload).push({ file, name });
  }

  const link = [];
  const rowsWithoutPdf = [];
  for (const row of rows) {
    if (row.pdf_path) continue;
    if (localByNumber.has(row.invoice_number)) {
      link.push({
        invoice_number: row.invoice_number,
        pdf_path: storageNameFor(row.invoice_number),
      });
    } else {
      rowsWithoutPdf.push(row.invoice_number);
    }
  }

  const filesWithoutRow = [...localByNumber.keys()].filter((n) => !rowNumbers.has(n));
  return { upload, alreadyInBucket, link, rowsWithoutPdf, filesWithoutRow };
}

async function listAll(fetchPage) {
  const all = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const page = await fetchPage(offset);
    all.push(...page);
    if (page.length < PAGE_SIZE) return all;
  }
}

export async function run({
  supabase,
  dir,
  confirm = false,
  readFile = (p) => fs.readFileSync(p),
  listDir = (d) => fs.readdirSync(d),
  log = console.log,
}) {
  const files = listDir(dir);

  const existing = await listAll(async (offset) => {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .list('', { limit: PAGE_SIZE, offset });
    if (error)
      throw new Error(`Cannot list bucket "${BUCKET}" (run migration 053?): ${error.message}`);
    return data || [];
  });

  const rows = await listAll(async (offset) => {
    const { data, error } = await supabase
      .from('staged_invoices')
      .select('invoice_number, pdf_path')
      .order('invoice_number')
      .range(offset, offset + PAGE_SIZE - 1);
    if (error) throw new Error(`Cannot read staged_invoices: ${error.message}`);
    return data || [];
  });

  const plan = buildPlan({ files, rows, existingNames: existing.map((o) => o.name) });
  log(`Local PDFs: ${files.filter((f) => f.toLowerCase().endsWith('.pdf')).length}`);
  log(`  to upload: ${plan.upload.length}, already in bucket: ${plan.alreadyInBucket.length}`);
  log(`Invoice rows to link (pdf_path empty, local PDF found): ${plan.link.length}`);
  log(`Invoice rows without any PDF: ${plan.rowsWithoutPdf.length}`);
  log(`Local PDFs without an invoice row: ${plan.filesWithoutRow.length}`);

  const summary = { ...plan, uploaded: 0, uploadErrors: [], linked: 0, linkErrors: [] };
  if (!confirm) {
    log('\nDry run only. Re-run with --confirm to upload and link.');
    return summary;
  }

  const available = new Set(plan.alreadyInBucket.map((u) => u.name));
  for (const { file, name } of plan.upload) {
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(name, readFile(path.join(dir, file)), {
        contentType: 'application/pdf',
        upsert: false,
      });
    if (error) {
      summary.uploadErrors.push({ file, error: error.message });
    } else {
      summary.uploaded++;
      available.add(name);
    }
  }

  for (const { invoice_number, pdf_path } of plan.link) {
    if (!available.has(pdf_path)) continue;
    const { error } = await supabase
      .from('staged_invoices')
      .update({ pdf_path })
      .eq('invoice_number', invoice_number)
      .is('pdf_path', null);
    if (error) summary.linkErrors.push({ invoice_number, error: error.message });
    else summary.linked++;
  }

  log(`\nUploaded: ${summary.uploaded}, upload errors: ${summary.uploadErrors.length}`);
  log(`Linked: ${summary.linked}, link errors: ${summary.linkErrors.length}`);
  summary.uploadErrors.forEach((e) => log(`  upload failed: ${e.file}: ${e.error}`));
  summary.linkErrors.forEach((e) => log(`  link failed: ${e.invoice_number}: ${e.error}`));
  return summary;
}

async function main() {
  const args = process.argv.slice(2);
  const dirIndex = args.indexOf('--dir');
  const dir = dirIndex >= 0 ? args[dirIndex + 1] : 'public/invoices';

  const { default: dotenv } = await import('dotenv');
  dotenv.config({ path: ['.env.local', '.env'] });
  const { createClient } = await import('@supabase/supabase-js');

  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  const email = process.env.VITE_ADMIN_EMAIL;
  const password = process.env.VITE_ADMIN_PASSWORD;
  if (!url || !anonKey || !email || !password) {
    console.error(
      'Missing VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_ADMIN_EMAIL or VITE_ADMIN_PASSWORD in .env.local',
    );
    process.exit(1);
  }

  const supabase = createClient(url, anonKey, { auth: { persistSession: false } });
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    console.error('Admin login failed:', error.message);
    process.exit(1);
  }

  const summary = await run({ supabase, dir, confirm: args.includes('--confirm') });
  if (summary.uploadErrors.length || summary.linkErrors.length) process.exit(1);
}

if (
  process.env.JEST_WORKER_ID === undefined &&
  process.argv[1] === fileURLToPath(import.meta.url)
) {
  main().catch((e) => {
    console.error('Migration failed:', e.message || e);
    process.exit(1);
  });
}
