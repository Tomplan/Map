# Project To-Do

## Standing rule

- Always add Dutch (`nl.json`), English (`en.json`) and German (`de.json`) translations for all new text and UI components.

## After the event (Na de beurs)

- [ ] **Move the Supabase project from Micro back to Nano so it costs nothing.** Nano is a Free-plan compute size: paid organizations cannot launch Nano, and a Nano instance in a paid organization is billed like Micro (Supabase docs, "Compute and Disk"). So changing the compute size alone is not enough; the organization must be downgraded to the Free plan (Dashboard → Organization → Billing), after which the project runs on Nano. Before downgrading, check:
  - Database size and storage are within Free limits (500 MB database, 1 GB storage; the `invoices` bucket and logos count towards storage) and egress stays under 5 GB/month.
  - Free projects have no Supabase-managed backups: keep the daily GitHub Actions backup (`.github/workflows/backup.yml` → private repo `Map-backups`) running and take one manual full backup first (`npm run backup:full`).
  - Free projects pause after about a week without activity; the daily backup job makes API calls that normally keep the project active, but verify in the dashboard after the first week.
  - Pro-only features are lost (daily/PITR backups, longer log retention, higher Realtime/connection limits); see `docs/SCALING_LIMITS_MEMO.md` before the next event.
  - Compute changes can cause a short downtime; do it outside event hours and re-run `npm run backup:status` afterwards.
- [ ] _(add the other after-event tasks here)_

## Open verification (invoices)

- [ ] Validate granular line-item invoice approval mapping into the `event_subscriptions` table.
- [ ] Verify undo-items logic removes counts safely without orphaned records.
- [ ] Check history logs reflect invoice patching properly.

## Open code TODOs

- [ ] `scripts/backup/backup-critical.js` and `backup-full.js`: send an e-mail/Slack notification when a backup fails.
- [ ] `src/components/FeedbackForm.jsx`: replace the placeholder with a real API call.
- [ ] `src/hooks/useAnalytics.js`: replace the placeholder with real analytics (e.g. Google Analytics, Mixpanel).

## Privacy

- Decided 2026-11-05 not to rewrite git history for the removed invoice PDFs, `out/my-company-texts.xlsx` and `scripts/invoices/parsed_invoices.json`; see the incident note in `docs/development/INVOICE_PDF_STORAGE.md`. Revisit only if the assessment changes (a backup of the repository from before any rewrite exists outside the repo).
