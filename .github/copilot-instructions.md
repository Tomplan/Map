### Clarification Rule

If a user request is unclear or ambiguous, always ask for more details or clarification instead of making assumptions or inventing information. Only answer based on explicit instructions or actual code context.

# Copilot Instructions for Event Map App

## Project Overview

- Mobile-first React web app for event navigation, hosted on GitHub Pages.
- Uses Leaflet (with plugins), Tailwind CSS, Material Design Icons, and Supabase for admin-only data.
- Map features: interactive layers, custom zoom/home controls, dynamic marker visibility, tooltips/popups, and admin dashboard.

## Architecture & Key Files

- Main map logic: `src/components/EventMap.jsx`
- Localization: `src/locales/en.json`, `src/locales/nl.json`, setup in `src/i18n.js`
- Accessibility tests: `src/App.a11y.test.js`
- Service worker for offline support: `public/service-worker.js`
- Marker data: managed via Supabase (private), not in public files

## Developer Workflows

- Build: `npm run build`
- Dev server: `npm run dev`
- Test: `npx jest` (includes accessibility and marker rendering tests)
- Offline support: enabled via service worker, see banner in UI when offline

## Project-Specific Patterns

- Custom zoom/home buttons use Material Design icons via `react-icons/md`
- Marker icons are SVGs, color and type set in `EventMap.jsx`
- Admin dashboard allows marker drag/drop, rotation, and locking
- Marker visibility controlled by zoom level and admin settings
- Localization via `react-i18next`; add new languages by updating `src/locales` and `i18n.js`
- Accessibility: semantic HTML, ARIA roles, keyboard navigation, automated a11y tests

## Integration Points

- Supabase: used for secure admin-only data (credentials, phone numbers, etc.)
- Leaflet plugins: Carto Voyager, Esri World Imagery, custom controls
- Service worker: caches map tiles and marker data for offline use

## Conventions & Patterns

- All marker and control icons use Material Design SVGs, sized via props/styles
- Admin-only info is never stored in public files
- Undo/redo and lock features for marker management
- Data import/export supports CSV/Excel/JSON, including admin-only fields
- UI/UX: home button always visible, zoom steps of 0.5, tooltips show name/logo, popups for full info

## Examples

- To add a new marker type: update SVGs in `EventMap.jsx`, add icon to Material Design set, and update admin dashboard logic
- To add a new language: create `src/locales/{lang}.json`, update `i18n.js`
- To test accessibility: run `npx jest src/App.a11y.test.js`

## References

- See `README.md` for full feature list and implementation notes
- Service worker details: `public/service-worker.js`
- Localization setup: `src/i18n.js`, `src/locales/`

---

## Additional Agent Rules

### Proactive Guidance Rule

Always point out:

- Any expected errors or warnings due to incomplete setup.
- Any steps the user needs to complete (like adding credentials, configuring services, or running commands).
- Any limitations or requirements before features will work.

- ALWAYS inspect computed styles for both container and SVG elements when diagnosing UI sizing issues.
- If an SVG is not sized as expected, check the viewBox and path width; browser may shrink icon to fit path, not container.
- Use minWidth or explicit width on both container and SVG to override browser shrinkage when SVG path is narrow.
- Diagnostic tests may pass in isolation, but ALWAYS validate in the live UI.
- Systematic, step-by-step deduction is faster and more reliable than trying multiple workarounds.

### User Collaboration Rule

If code inspection alone cannot fully resolve a user request, always proactively ask the user for help—such as providing runtime data, field values, console output, or screenshots—before making assumptions or proceeding. User collaboration is required for any issue that depends on live data or environment state.
