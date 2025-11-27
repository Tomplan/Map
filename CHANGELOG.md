# Changelog

All notable changes to this project will be documented in this file.

## Unreleased

- Feature: Per-marker base sizing for marker icons and glyphs (DB migration added) — admins can set `iconBaseSize`, `glyphBaseSize` and `shadowScale` per marker. (migrations/29_add_marker_base_sizes.sql)
- Frontend: Marker sizing engine updated to use per-marker base sizes + zoom buckets with CSS smoothing and caching improvements.
- Admin: UI expanded to edit per-marker base sizes & defaults (Map management). Appearance persistence added.
- Offline: Service worker precaches common marker assets and default logos to reduce runtime requests.
- Tests: New unit & integration tests for marker sizing and snapshots (EventClusterMarkers + markerSizing tests).
- Docs: rollout and QA documentation added: docs/ZOOM_MARKER_SIZE_ROLLOUT.md
