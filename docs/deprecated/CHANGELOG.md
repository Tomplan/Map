# Changelog

All notable changes to this project will be documented in this file.

## Unreleased

- Feature: Per-marker base sizing for marker icons and glyphs (DB migration added) — admins can set `iconBaseSize`, `glyphBaseSize` and `shadowScale` per marker. (migrations/29_add_marker_base_sizes.sql)
- Frontend: Marker sizing engine updated to use per-marker base sizes + zoom buckets with CSS smoothing and caching improvements.
- Frontend: Marker sizing engine updated to use per-marker base sizes + zoom buckets with CSS smoothing and caching improvements.
  - Hybrid smoothing: markers now scale smoothly during zoom animation (GPU transform) and finalize crisp icon sizes at zoom end for best visual quality and performance.
- Admin: UI expanded to edit per-marker base sizes & defaults (Map management). Appearance persistence added.
- Offline: Service worker precaches common marker assets and default logos to reduce runtime requests.
- Offline: Service worker precaches app shell (index.html) and common marker assets so public /Map visitor view works more reliably offline after a first visit; markers are persisted in localStorage for offline fallback.
- Tests: New unit & integration tests for marker sizing and snapshots (EventClusterMarkers + markerSizing tests).
- Docs: rollout and QA documentation added: docs/ZOOM_MARKER_SIZE_ROLLOUT.md
- Fix: Persist "Favorites Only" toggle across navigation in visitor views (Exhibitor list + Map) — saved per event year in localStorage
