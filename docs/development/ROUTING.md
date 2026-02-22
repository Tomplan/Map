# Routing strategy and migration guide

## Overview

This app uses React Router with a HashRouter by default to support static hosting (GitHub Pages) without server-side rewrites. The decision is intentional: it ensures the app works reliably when served from a base path (e.g., `/Map`) and avoids 404s for deep links on hosts that do not provide history fallback.

Key points:

- The app uses `HashRouter` with `basename={import.meta.env.BASE_URL || '/'}` so all generated links respect the configured base path.
- A `public/404.html` client-side fallback exists and redirects unknown requests into the app by preserving the requested path and injecting it into the fragment: `index.html#<original-path>`. This makes `https://host/Map/admin` resolve to the SPA's hash-based route on GitHub Pages.
- The app contains a client-side normalizer that ensures canonical forms such as:
  - `/Map` -> `/Map#/`
  - `/Map/#/admin` -> `/Map#/admin`
  This improves predictability and prevents variants from confusing users or tooling.

## Canonical local URLs (when `vite.base` or `BASE_URL` is `/Map`)

- Public visitor map: `http://localhost:5173/Map#/`
- Admin panel: `http://localhost:5173/Map#/admin`

> Tip: Run `npm run dev:ci` to start the dev server non-interactively, or `npm run dev:strict` to fail immediately when port 5173 is already in use.

---

## Why not `BrowserRouter` (clean `/Map/admin` paths)?

- Clean URLs are nicer but require server-side history fallback so direct navigation to `/Map/admin` returns `index.html`. On GitHub Pages we rely on `public/404.html` to implement a fallback by redirecting unknown paths into the hash form; however this is a client-side redirect and may slightly change the request flow.
- If we decide to pursue clean URLs (BrowserRouter), ensure:
  1. `public/404.html` is deployed and tested, because it will be responsible for preserving paths and redirecting to the SPA. (We already have a `404.html` that preserves and injects the path into the hash.)
  2. Any code constructing reset / login redirect URLs is updated to build normal browser paths (no hash fragments).
  3. Add e2e tests asserting the migration works and fallback behavior on GitHub Pages.

## How to migrate to BrowserRouter (step-by-step)

1. Replace `HashRouter` with `BrowserRouter` in `src/App.jsx` and keep `basename={import.meta.env.BASE_URL || '/'}`.
2. Update code that builds URLs by adding/removing hashes where appropriate (e.g., `AdminLogin.jsx` reset password redirect). See TODOs in code base for places that mention HashRouter specifically.
3. Add an e2e test that simulates visiting `/Map/admin` on a deployed or served site and verify user lands on the admin UI.
4. Verify `public/404.html` remains present in the deployed site and behaves correctly (the script redirects to `index.html#<path>`).

## Tests and automation

- There is an e2e script at `scripts/e2e/routing-e2e.cjs` to validate canonicalization on a running dev server. Run it locally as:
  ```bash
  PORT=5173 node scripts/e2e/routing-e2e.cjs
  ```
  This script expects the dev server to be available at `http://localhost:<PORT>` and asserts canonical URL normalization for a handful of commonly used paths.

---

If you'd like, I can also add a CI job that runs the e2e routing check during a build to prevent regressions.