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

## Incident note: invoice PDFs were publicly accessible (2026-03-09 to 2026-11-05)

Recorded on 2026-11-05 for the project's own records.

**What happened**

- 227 invoice PDFs were committed under `public/invoices/` on 2026-03-09 (commit `6c70c74b`) in this
  public repository. Because everything in `public/` is published, they were also served by GitHub
  Pages at `…/invoices/<number>.pdf` (production and `/dev/`) with guessable file names. A copy of
  the same PDFs was kept on the `gh-pages` branch.
- Two derived files were committed as well: `out/my-company-texts.xlsx` and
  `scripts/invoices/parsed_invoices.json`.
- The PDFs contain company names, contact person names and addresses, and invoice lines/amounts.
- No passwords or service keys were found in the history. The only committed `.env` (on `gh-pages`,
  2025-10-31) contains the Supabase URL and the public anon key.

**What was done (2026-11-05)**

- Created a private Supabase Storage bucket `invoices` with staff-only policies (migration `053`) and
  moved all 227 PDFs into it (227 uploaded, 89 invoice rows linked, 0 errors).
- Removed the files from the repository and the published site: v1.2.64 untracks and git-ignores them;
  `invoices/` and `dev/invoices/` were deleted from the `gh-pages` branch. Both
  `…/Map/invoices/2024001.pdf` and `…/Map/dev/invoices/2024001.pdf` now return 404.
- Local copies were moved outside the repository.

**Exposure checks (2026-11-05)**

- Google: `site:tomplan.github.io inurl:invoices` returned no results.
- Internet Archive (Wayback Machine): no snapshots for `/Map/invoices/*` or `/Map/dev/invoices/*`.
- GitHub traffic (last 14 days only): 27 clones by 18 unique cloners, 0 repository views,
  0 forks, 0 stars, 0 watchers. Clones are not attributable to people and may include bots and the
  project's own machines. GitHub Pages keeps no access log, so access to the PDF URLs cannot be
  determined.

**Decision (project owner, 2026-11-05)**

- No data-breach notification: the owner's assessment is that the data concerns business contact
  details that are available online elsewhere. This is the owner's assessment, not legal advice.
- The git history is **not** rewritten. The PDFs therefore remain retrievable from old commits
  (including via GitHub's `refs/pull/*` references). A full backup of the repository from before any
  such rewrite is kept outside the repository (`~/Documents/Map-before-purge.git`) in case the decision
  is revisited. Rewriting would require force-pushes on `main`, `development` and `gh-pages` and a
  GitHub Support request to remove cached views of pull-request references.
- Going forward: never place customer or invoice data in `public/` or commit it. Invoice PDFs belong in
  the private `invoices` bucket only.
