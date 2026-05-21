git checkout -b feat/admin-exhibitor-arrival || git checkout feat/admin-exhibitor-arrival
git add migrations/040_add_has_arrived.sql migrations/041_update_event_markers_view.sql
git add src/components/admin/EventSubscriptionsTab.jsx src/components/EventClusterMarkers.jsx src/index.css src/utils/markerIcons.js
git commit -m "feat: Add Exhibitor Arrival Tracking for Admins

- Add has_arrived boolean to event_subscriptions
- Expose has_arrived via event_markers_view
- Add arrived toggle to EventSubscriptionsTab
- Add green arrival ring to map markers (Admin view only)
"
