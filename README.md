Here’s a full summary of our conversation so far. You can copy and paste this into a file (like README.md or requirements.txt) in your workspace to keep all your info safe.
 
Event Map App – Full Planning Summary
General Concept
•	Mobile-first web app for event navigation.
•	Uses Leaflet (with plugins), Tailwind CSS, Material Design Icons.
•	Optimized for GitHub Pages hosting.
•	Supabase backend for admin-only data (secure, private).
Map Features
•	Interactive map with multiple layers (Carto Voyager, Esri World Imagery).
•	Custom zoom buttons (Material Design icons), home button always visible.
•	Default center: 51.898945656392904, 5.779029262641933; default zoom: 17; min zoom: 14; max zoom: 21; zoom steps: 0.5.
•	Special markers (Event, Parking, Parking Disabled, Food, etc.) visible at home view; booth-holder markers appear at higher zoom.
•	Admins can set “Min Zoom” and “Max Zoom” per marker.
•	Tooltip on hover shows booth-holder name and logo; popup on click shows full info.
•	Admins can upload SVGs/icons and logos for markers.
•	Two selectable map layers; admins can choose default for users.
Marker Data
•	Each marker: id (auto-generated, read-only), lat, lng, booth number, name, icon/color ref, logo, website, info, angle (for rectangle overlay), min/max zoom.
•	Rectangle (6mx6m, angle adjustable) for booth-holder markers, visible only in admin preview layer.
•	Admins can drag/drop markers, rotate rectangle interactively, and lock positions for event day.
•	Markers can be set to appear/disappear at specific zoom levels.
Admin Dashboard
•	Secure login (shared password, up to 5 admins).
•	Dashboard columns: public info (color/icon, booth number, name, logo, website, description), admin-only info (id, responsible person, phone, number of booths, area, coins, breakfast/lunch/BBQ counts, extra notes).
•	Sorting/filtering by columns.
•	Import/export template (CSV/Excel/JSON) with all fields, including coordinates and admin-only info.
•	Undo/redo for session changes; backup/restore for long-term safety.
•	Manual “Lock Public Info” button; any admin can lock/unlock; visual indicator and notification for lock status.
•	Admins can switch between map layers and set default for users.
•	Simple, clear built-in admin guide.
•	Admins can add internal notes/comments per marker.
Hosting & Security
•	Public app and admin dashboard hosted on GitHub Pages (static site).
•	Supabase backnrxd for sensitive admin-only data (e.g., phone numbers).
•	All admins can view/edit full data in export/import files.
•	Sensitive data (like phone numbers) is not stored in public static files.
UI/UX
•	Material Design Icons for all marker types and controls.
•	Map preview in dashboard; drag-and-drop/click to set marker locations.
•	Confirmation and undo/redo for moving markers; option to lock positions on event day.
•	Home button always visible; zoom buttons use 0.5 step increments.
•	Tooltip shows both name and logo if space allows; popup on click for full info.
Other Features
•	User feedback form (FeedbackForm component) exists and can be enabled in the UI when needed for collecting event feedback.
•	Admins can upload and manage SVGs/icons and logos.
•	Multiple map layers; admins can switch and set default.
•	Admins can set marker visibility by zoom level.
•	Admin guide included in dashboard for easy reference.

Additional Planned Features
--------------------------

Core Features:
----------------
Accessibility:
- High-contrast mode, larger text options, keyboard navigation, and screen reader support for users with disabilities.

Performance:
- Lazy loading for map tiles and images.
- Optimized data fetching and caching for smooth user experience.

Analytics:
- Track user interactions (e.g., most viewed markers, map usage) for event insights.

Offline Support:
- Cache basic map and marker data for limited offline use during the event.

Custom Branding:
- Event logo, theme colors, and custom fonts for a branded experience.

Optional Features:
------------------
Notifications:
- Event updates or announcements for users (e.g., schedule changes, emergency info).

User Feedback:
- Simple feedback form for users to report issues or suggest improvements.

Localization:
- The app UI will be in English and event content will be in Dutch for now. Future support for more languages is planned.

Admin Collaboration:
- Real-time updates or notifications when multiple admins are editing.

Data Export:
- Allow admins to export event data (attendance, booth visits, feedback) for post-event analysis.

Implementation Notes
===================

Localization:
- Implemented using `react-i18next` and `i18next`.
- Translation files are located in `src/locales/en.json` (English) and `src/locales/nl.json` (Dutch).
- The i18n setup is in `src/i18n.js`. Default language is English; Dutch event content is supported.
- To use translations in components: `import { useTranslation } from 'react-i18next';` and use `t('key')`.
- Future languages can be added by creating new JSON files in `src/locales` and updating `i18n.js`.

Accessibility:
- Main content is wrapped in a `<main>` landmark for screen readers and keyboard navigation.
- Main heading uses `<h1>` for semantic structure and accessibility.
- Accessibility is verified by automated tests in `src/App.a11y.test.js` (using React Testing Library).
- Further improvements planned: high-contrast mode, scalable text, keyboard navigation, and ARIA roles.

Offline Map Support:
-------------------
- The app uses a service worker (Workbox) to cache map tiles and static assets for offline use.
- When offline, users see a notification and can still view previously loaded map areas and marker data.
- Marker data is cached in localStorage and loaded automatically if offline.
- To enable offline map tiles, the service worker caches requests to Carto Voyager tile URLs.
- See `public/service-worker.js` for implementation details.
- Offline status is indicated in the UI via a banner at the bottom of the screen.


