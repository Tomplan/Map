# Invoice PDFs: private storage

Invoice PDFs contain customer names and addresses, so they must never be served from `public/`
(everything in `public/` is published on GitHub Pages and, in a public repo, readable by anyone).

New imports are uploaded by the Invoice Sync tab to the **private** Supabase Storage bucket
`invoices` and opened through short-lived signed URLs
(`src/services/invoicePdfUploadService.js`, column `staged_invoices.pdf_path`).

## One-time migration of the legacy PDFs

1. Run `migrations/053_invoices_bucket_policies.sql` in the Supabase SQL editor
   (creates/keeps the bucket private and adds staff-only policies).
2. Make sure `.env.local` contains `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`,
   `VITE_ADMIN_EMAIL` and `VITE_ADMIN_PASSWORD` (an admin account; RLS applies, no service key).
3. Dry run, then the real run:

   ```bash
   node scripts/invoices/migrate-pdfs-to-storage.js            # dry run, changes nothing
   node scripts/invoices/migrate-pdfs-to-storage.js --confirm  # upload + set pdf_path
   ```

   The script skips files already in the bucket and only fills `pdf_path` where it is empty, so it
   is safe to re-run.
4. Open a few invoices in the admin Invoice Sync tab (View PDF) to verify the signed links.

Only after this is verified are the PDFs removed from `public/` and git (done in v1.2.64: the
`public/invoices` fallback is gone, the folder is git-ignored and the app only opens PDFs through
signed URLs; invoices without a `pdf_path` show no PDF link). Keep a local copy of the originals
outside the repo if you still need them.
