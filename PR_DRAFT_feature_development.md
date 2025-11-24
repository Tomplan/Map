Title: i18n: add German schedule content + admin modal improvements

Summary

This draft PR moves the i18n and schedule work onto `feature/development` for review. It contains:

- Migration: `migrations/21_add_de_columns_event_activities.sql` — adds `title_de`, `description_de`, `location_de`, `badge_de` and backfills from existing English values before re-adding the `valid_location` check.
- Admin UI: `src/components/ActivityForm.jsx` — refactored to show NL / EN / DE tabs for content fields; admin UI labels are kept EN/NL only.
- Public UI: `src/components/EventSchedule.jsx`, `src/components/ProgramManagement.jsx`, `src/hooks/useEventActivities.js` — read and render `*_de` fields when `i18n.language === 'de'`.
- Import support: `src/data/de_schedule.json` (example scraped entries) and `src/scripts/import_de_schedule.cjs` (idempotent import script, supports `--dry-run`).
- Locale work and helper scripts: some merging/placeholder helper scripts were added under `src/scripts/` and a merged `src/locales/de.json` exists on the feature branch.

Files changed (high level)

- migrations/21_add_de_columns_event_activities.sql
- src/components/ActivityForm.jsx
- src/components/EventSchedule.jsx
- src/components/ProgramManagement.jsx
- src/hooks/useEventActivities.js
- src/data/de_schedule.json
- src/scripts/import_de_schedule.cjs
- src/locales/de.json
- plus supporting i18n helper scripts

Testing / QA notes

1. Run DB migration before importing or relying on `*_de` columns:
   - Use your normal migration tooling or psql to run `migrations/21_add_de_columns_event_activities.sql`.
2. To validate the import script (dry-run):

```bash
SUPABASE_URL=https://<your-supabase-url> SUPABASE_KEY=<service-role-key> node src/scripts/import_de_schedule.cjs --dry-run
```

3. To run the import for real (use a service role key, keep it secret):

```bash
SUPABASE_URL=https://<your-supabase-url> SUPABASE_KEY=<service-role-key> node src/scripts/import_de_schedule.cjs
```

4. Start dev server and inspect admin program UI:

```bash
npm install
npm run dev
# open http://localhost:5173/#/admin/program or use the UI nav
```

- Open an Activity to edit: use the NL/EN/DE tabs to edit localized fields — they persist to `event_activities` as `*_nl`, `*_en`, `*_de` fields.
- On the public site, switch the language to German (e.g. set `localStorage.setItem('i18nextLng','de')` then reload) and confirm schedule displays German titles/descriptions/locations.

PR Checklist (for reviewers)

- [ ] Migrations applied to test DB and verified (no constraint violations) — migration includes a backfill for `*_de` fields.
- [ ] Admin modal usability: tabs behave correctly and required fields enforce validation per language expectations.
- [ ] Import script runs in dry-run mode and creates the mapped rows correctly.
- [ ] Unit / integration tests updated if applicable.

How to create the PR locally (if you have `gh`):

```bash
# from repo root
gh pr create --draft --title "i18n: add German schedule content + admin modal improvements" \
  --body-file PR_DRAFT_feature_development.md --base development --head feature/development
```

If you prefer I open the PR for you, provide a GitHub access token or let me know and I can attempt via `gh` CLI again.
