## Zoom-level marker sizing — design & rollout plan

Status: Draft — discussion + review needed

Overview
--------
- Goal: allow marker icon sizes (including cluster icons) to change smoothly and sensibly with map zoom level so the map stays readable and useful at all scales.
- Deliverable: a backwards-compatible design pattern and implementation plan for dynamic marker sizing (no implementation code in this document).

Key findings from the codebase
-----------------------------
- Marker icons are created via `createMarkerIcon` in `src/utils/markerIcons.js`. Icon sizes currently come from a per-marker `iconSize` prop (or default values in the utils file).
- Clusters are produced by `react-leaflet-markercluster` and use an `iconCreateFunction` from `src/utils/clusterIcons.js` with a fixed cluster icon size.
- `EventClusterMarkers.jsx` and `EventSpecialMarkers.jsx` pass `iconSize` into the icon creation utility and cache icons; markers are React-Leaflet `Marker` objects.

Feasibility summary (short)
--------------------------
- Feasible: Leaflet supports map zoom events, and react-leaflet markers accept new icon objects. The shape of the codebase (a central createMarkerIcon util + components that compute icons per marker) makes this change possible.
- Tradeoff: two main approaches exist. Recreating icons per zoom (accurate anchor/hitbox) requires more work and careful caching; pure CSS scaling is fast but misaligns anchors and hitboxes.

Recommendation (overall approach)
--------------------------------
Adopt a hybrid approach to get the best of both worlds:

1. Render smoothly using CSS transforms during continuous zoom (`zoom` event) to provide a visually nice transition.
2. At discrete zoom boundaries (e.g., after a short debounce on `zoomend`), recalculate and set real Leaflet icon sizes and anchors by recreating icons and updating markers. This keeps hitboxes and popup/tooltip anchors correct.

This reduces churn and keeps interactivity correct while still giving smooth visual behaviour.

Design details
--------------
1) Zoom state plumbing
   - Track the current map zoom in a single source of truth (e.g., `EventMap` state). Subscribe to Leaflet `zoom` and `zoomend` events.
   - Provide the zoom value (or computed scale factor) to marker components (`EventClusterMarkers`, `EventSpecialMarkers`) as props or via React context.

2) Sizing model / configuration
   - Support two configuration modes (per-project in MAP_CONFIG):
       A) explicit mapping: zoom -> size (recommended when design wants tight control), e.g. {
          "markerSizes": { "booth": { "10": [20,34], "14": [30,50], "18": [40,68]}, ... }
       B) scale based: base-size + function f(zoom) = base * scale(zoom) with min/max clamps (recommended for smooth scale across zoom range).
   - Provide sensible defaults so nothing breaks when the feature is off. Keep `marker.iconSize` as the base size when not configured.

3) Icon creation & caching
   - Continue using `createMarkerIcon` as the canonical constructor. Compute an `effectiveIconSize` for each marker using the sizing model.
   - Key caches by marker visual properties plus current zoom bucket/id so icons are reused when possible (e.g., `iconsByMarker[markerId][zoomBucket]`).
   - When the zoom bucket changes at `zoomend`, update icons for visible markers (or call Leaflet's `setIcon` via react-leaflet prop updates). Keep operations batched and throttled to avoid UI freezes.

4) Cluster icons
   - Re-generate `iconCreateFunction` with awareness of current zoom (e.g., factory that accepts current zoom). When zoom changes, re-create the function and pass it to `MarkerClusterGroup` so cluster icons match marker sizing.
   - Optionally use a different scaling factor for cluster icons (they should be visually distinct and not overlap tiles or labels).

5) Smooth transitions
   - Use CSS transform scale for in-flight transitions while the user is continuously zooming. Apply a CSS variable (e.g., `--marker-scale`) on the map container and set per-marker use of transform based on that variable.
   - On `zoomend`, set concrete icon sizes (update Leaflet icon objects and clear/normalize CSS transforms) so anchors match the new size.

6) Admin view considerations
   - Offer a configuration toggle to disable scaling in admin mode (important for precise drag/drop placement). Default: scaling off for admin, on for public map.

7) Backwards compatibility and opt-in
   - Feature off by default. Add `MAP_CONFIG.MARKER_SIZING_ENABLED` (or similar) so events can opt in.
   - Preserve `marker.iconSize` as base sizes so existing marker records remain valid.

Performance & caching considerations
----------------------------------
- Cache icons per marker per zoom bucket to avoid re-allocating many icons on small incremental zoom changes.
- Throttle/debounce zoom-based updates to layout (use fast CSS scaling for continuous zoom, and reflow / setIcon only on `zoomend`).
- For very large datasets, only update icons for visible markers (check map bounds) — this is already a pattern in the app (some cluster options exist).
- Avoid unnecessary React re-renders: keep memoization working and expand cache keys only to include zoom buckets, not continuous floats.

UX, accessibility & testability
--------------------------------
- Target minimum touch/click size at all zooms (e.g., a minimum of ~36–44px tappable area) for accessibility and touch users.
- Ensure popups and tooltip anchors align with visually scaled icons after `zoomend` (adjust popupAnchor/iconAnchor computation accordingly).
- Add visual tests (storybook & snapshots) for a few representative zoom levels and for clusters.

Telemetry & rollout
-------------------
- Add feature-flag rollout strategy and a MAP_CONFIG toggle. Log telemetry events when the feature is enabled and when users interact with scaled markers (optional).

Testing checklist
-----------------
1. Unit tests
   - Validate size computation utility: given base size + zoom -> derived size.
   - Validate cluster icon generation when given different zoom inputs.

2. Integration tests
   - Simulate zoom changes and assert markers call `setIcon` or are replaced with correctly sized icons on `zoomend`.
   - Confirm CSS scaling during continuous zoom (can be visual assertion via DSI or DOM tests).

3. E2E / Visual regression
   - Capture screenshots at a handful of zoom levels for both admin and public maps showing markers, clusters, and popups.

Files likely to change (implementation-phase)
-------------------------------------------
- src/components/EventMap/EventMap.jsx — track/emit zoom state & config option.
- src/components/EventClusterMarkers.jsx — honor effective icon size per zoom; update caches to include zoom; re-create cluster icon function when zoom changes.
- src/components/EventSpecialMarkers.jsx — same as cluster markers for special markers.
- src/utils/markerIcons.js — expose helpers to compute anchors/shadow size for non-default icon sizes; accept / document expected `iconSize` values.
- src/utils/clusterIcons.js — accept a zoom-sensitive factory input.
- CSS files — add variables and rules to support CSS scaling for transitions.
- Tests — update snapshots and tests in `__tests__` to include zoom behavior.

Acceptance criteria
-------------------
1. Enabling the feature via MAP_CONFIG results in marker sizes (and cluster icons) changing according to the configured sizing model across zoom levels.
2. Touch/click hit areas and popup anchors remain accurate after `zoomend`.
3. Admin marker placement remains precise and can be opted-out from scaling.
4. No major performance regressions with a moderate sized dataset (hundreds of markers). If dataset is extreme (thousands), document further optimisations.

Open discussion items / choices to finalize
-----------------------------------------
• Exact sizing model (discrete zoom buckets vs continuous scaling). 
• Defaults for cluster vs single markers.
• Whether to enable scaling on admin view by default.

Next suggested tasks (implementation-ready)
-----------------------------------------
1. Add MAP_CONFIG options + unit tests for sizing utility functions.
2. Implement zoom tracking in `EventMap` and pass `currentZoom` to marker components.
3. Update `createMarkerIcon` + caching patterns to accept zoom buckets/scale keys.
4. Update `EventClusterMarkers` & `EventSpecialMarkers` to re-generate icons at `zoomend` and use CSS transforms while zooming.
5. Add tests and screenshots for a couple of zoom levels, then add an integration test to confirm anchors behave correctly.

If you'd like, I can now expand this into the small actionable PR tasks with explicit changes per file and tests to author next — or keep this plan as-is for team discussion. 

---
Generated on 2025-11-27 — keep this doc edited while the team discusses which sizing model to use.
