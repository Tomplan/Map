
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
•	Supabase backend for sensitive admin-only data (e.g., phone numbers).
•	All admins can view/edit full data in export/import files.
•	Sensitive data (like phone numbers) is not stored in public static files.
UI/UX
•	Material Design Icons for all marker types and controls.
•	Map preview in dashboard; drag-and-drop/click to set marker locations.
•	Confirmation and undo/redo for moving markers; option to lock positions on event day.
•	Home button always visible; zoom buttons use 0.5 step increments.
•	Tooltip shows both name and logo if space allows; popup on click for full info.
Other Features
•	Admins can upload and manage SVGs/icons and logos.
•	Multiple map layers; admins can switch and set default.
•	Admins can set marker visibility by zoom level.
•	Admin guide included in dashboard for easy reference.


