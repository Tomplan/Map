## Marker zoom-size rollout & QA checklist

Status: Draft — actionable rollout steps and verification to safely enable per-marker zoom-based sizing in production.

Scope
-----
- Ensure DB migration completes and new fields are backfilled for existing markers.
- Deploy frontend changes behind a feature flag so we can opt-in per-environment.
- Run visual checks for markers and clusters at several zoom levels.
- Monitor performance and telemetry for user regressions.

High-level rollout plan
----------------------
1. Code + migrations merged to a release branch.
2. Run DB migration on a staging replica and run verification checks (see migrations/verify_29_backfill.sql).
3. Deploy frontend with MAP_CONFIG.MARKER_SIZING_ENABLED=false (default off) on staging.
4. Toggle MAP_CONFIG.MARKER_SIZING_ENABLED=true in staging config and run QA checklist.
5. If successful, schedule a gradual rollout to production behind a feature flag.

DB verification SQL
-------------------
Run the queries in `migrations/verify_29_backfill.sql` to validate that new columns exist, that default values are applied and that there are no malformed rows.

Feature flag & config
---------------------
- Add/verify MAP_CONFIG.MARKER_SIZING_ENABLED in config for each environment.
- Initially enable on a subset of traffic or a single event to validate at scale.

Telemetry & metrics
-------------------
- Track the following events when the feature is enabled:
  - marker_sizing_enabled (env, event_id)
  - marker_icon_recreated (marker_id, zoom_bucket)
  - marker_anchor_mismatch (when popup offsets or anchors seem incorrect)
- Monitor tile and icon network requests (to ensure cache hits and no new excessive requests).

QA Checklist (staging)
----------------------
1. Browse to the staging map at multiple zoom levels: 12, 14, 16, 18, 20.
2. Observe individual marker sizes and clusters — they should scale smoothly between zoom levels.
3. Open a marker popup at each zoom and confirm popup anchoring is close to the icon tip.
4. In admin view, open marker placement editor and confirm drag-drop precision remains intact; verify admin UI toggle to disable scaling for placement.
5. Test offline behavior and service worker cache for marker assets.
6. Run automated snapshots (recorded in CI) for the most common zoom levels and for cluster-heavy views.

Rollback plan
-------------
1. Revert frontend toggle MAP_CONFIG.MARKER_SIZING_ENABLED=false (instant rollback for client behavior).
2. If DB migration causes issues: restore DB snapshot and re-run corrected migration.

Notes
-----
- Keep the rollout incremental and observability-oriented. If a severe issue appears, toggling the feature flag off will be the fastest rollback.
