# Client Handover Checklist

This checklist is tailored to the Map app: React/Vite frontend, GitHub Pages hosting, and Supabase backend.

## 1. Decide the ownership model

- Preferred setup: the client owns the GitHub organization and the Supabase organization.
- Keep at least two admins where possible:
  - one client-side admin
  - one technical admin during migration
- Use a client-owned shared mailbox only if the client prefers a single administrative address.

## 2. Create the client accounts

- Create a client GitHub account or organization.
- Create a client Supabase account or organization.
- Invite your own account as admin/owner so you can complete the migration.
- Verify the client can still access both systems after you leave.

## 3. Move the app assets

- Transfer the repository to the client GitHub organization or add the client as owner.
- Confirm the production branch and release flow.
- Make sure deployment still points to the correct host.
- Check the app base path if it is served from a subpath such as `/Map/`.

## 4. Move Supabase ownership

- Transfer or recreate the Supabase project under the client organization.
- Reconnect the app using the new `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- Verify database access, auth, storage buckets, and realtime subscriptions.
- Check that admin login, uploads, and any email flows still work.

## 5. Secrets and configuration

- List every environment variable used by the app and scripts.
- Rotate any shared secrets after the transfer.
- Remove old personal credentials from CI, hosting, and Supabase.
- Confirm who owns backup credentials and restore access.

## 6. Test before handover

- Open the public app on desktop and mobile.
- Test admin login.
- Test marker edits or other core admin actions.
- Test uploads and any email-based flows.
- Test the production deployment URL.

## 7. Deliver to the client

- Give the client a short access summary:
  - GitHub organization name
  - Supabase project name
  - Production URL
  - Backup location
  - Main admin contact
- Hand over a brief maintenance note with:
  - how to invite new admins
  - how to rotate secrets
  - how to restore from backup
  - who to contact for support

## Recommended low-friction workflow

1. Ask the client for one owner email address.
2. Create the client GitHub and Supabase organizations.
3. Add your account as temporary admin.
4. Migrate repo, hosting, and Supabase.
5. Test everything.
6. Remove your elevated access or leave only the agreed support role.

## What the repo already supports

- GitHub Pages deployment via `gh-pages`.
- Supabase configuration via `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- Backup and restore scripts in `package.json`.
- Supabase email and multi-user documentation in `docs/deployment/`.

## Open items to confirm with the client

- Final production domain or subdomain.
- Who owns the GitHub organization.
- Who owns the Supabase organization.
- Who receives invoices and backup alerts.
- Whether the client wants direct admin access or prefers you to manage some parts.
