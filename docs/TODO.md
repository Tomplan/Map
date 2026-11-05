# Project To-Do

## Standing rule

- Always add Dutch (`nl.json`), English (`en.json`) and German (`de.json`) translations for all new text and UI components.

## Open verification (invoices)

- [ ] Validate granular line-item invoice approval mapping into the `event_subscriptions` table.
- [ ] Verify undo-items logic removes counts safely without orphaned records.
- [ ] Check history logs reflect invoice patching properly.

## Open code TODOs

- [ ] `scripts/backup/backup-critical.js` and `backup-full.js`: send an e-mail/Slack notification when a backup fails.
- [ ] `src/components/FeedbackForm.jsx`: replace the placeholder with a real API call.
- [ ] `src/hooks/useAnalytics.js`: replace the placeholder with real analytics (e.g. Google Analytics, Mixpanel).

## Privacy

- [ ] Decide whether to purge the removed invoice PDFs, `out/my-company-texts.xlsx` and `scripts/invoices/parsed_invoices.json` from git history (needs a force-push; see `docs/development/INVOICE_PDF_STORAGE.md`).
