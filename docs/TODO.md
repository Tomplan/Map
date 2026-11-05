# Project To-Do

## Standing rule

- Always add Dutch (`nl.json`), English (`en.json`) and German (`de.json`) translations for all new text and UI components.

## After the event (Na de beurs)

- [x] **Move the Supabase project from Micro back to Nano so it costs nothing.** Done 2026-11-05: the organization was downgraded to the Free plan (Nano is a Free-plan compute size; a Nano instance in a paid organization is billed like Micro, so the plan change was required). After the restart the REST API answered, both sites loaded and a manual run of the backup workflow succeeded. Free limits for reference: 500 MB database, 1 GB storage, 5 GB egress/month, no Supabase-managed backups, auto-pause after about a week of inactivity. Still to verify:
  - [ ] In the dashboard: project shows Nano under Settings → Compute and Disk, and Billing shows no further charges.
  - [ ] After the first week: the project was not paused and egress stays under 5 GB (Reports).
  - [ ] Before the next event, re-read `docs/SCALING_LIMITS_MEMO.md` (Pro limits are lost: backups/PITR, log retention, Realtime and connection limits) and decide whether to upgrade for that month.
- [x] A failed daily backup now opens (or comments on) a GitHub issue labelled `backup-failed` with a link to the run, and the next successful run closes it (`.github/workflows/backup.yml`; test with the manual input `simulate_failure`). Make sure GitHub e-mail notifications for issues are on for the repository owner.
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
