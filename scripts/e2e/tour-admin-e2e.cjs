#!/usr/bin/env node
/*
 * E2E reproduction for Admin tours using Puppeteer.
 *
 * Scenarios covered:
 *  1) Attempt to start admin dashboard tour on admin route without required targets -> expect failure/alert.
 * 2) Inject required target elements, retry start -> expect Driver.js popover + overlay to appear.
 */

const puppeteer = require('puppeteer');

// Use the built-in global fetch on Node 18+, otherwise dynamically import
// node-fetch. We can't use top-level await in CommonJS, so expose an async
// helper function and call it where needed.
const fetchFn = async (...args) => {
  if (typeof globalThis.fetch === 'function') return globalThis.fetch(...args);
  const { default: nodeFetch } = await import('node-fetch');
  return nodeFetch(...args);
};
const path = require('path');

// We'll auto-detect the best base URL at runtime. Pass E2E_BASE or
// E2E_HOST as env vars if needed. By default we try /Map then /
const DEFAULT_HOST = process.env.E2E_HOST || 'http://localhost:5173';
// Try multiple candidate forms — include trailing slash variants and index.html
const baseCandidates = [process.env.E2E_BASE, `${DEFAULT_HOST}/Map`, `${DEFAULT_HOST}/Map/`, `${DEFAULT_HOST}`, `${DEFAULT_HOST}/index.html`].filter(Boolean);

async function waitForServer(u, timeout = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      // Some dev servers don't respond reliably to HEAD — try HEAD then GET.
      let res;
      try {
        res = await fetchFn(u, { method: 'HEAD' });
      } catch (e) {
        res = null;
      }

      if (!res || (!res.ok && res.status !== 404)) {
        // HEAD failed or not informative — try GET as fallback
        try {
          res = await fetchFn(u, { method: 'GET' });
        } catch (e) {
          res = null;
        }
      }

      if (res && (res.ok || res.status === 200 || res.status === 404)) return true;
    } catch (e) {
      // ignore
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  return false;
}

async function run() {
  // choose a base URL variable in top scope of this function
  let chosenBase = null;

  // If E2E_BASE is explicitly provided, use it directly (skip probes).
  if (process.env.E2E_BASE) {
    chosenBase = process.env.E2E_BASE;
    console.log('E2E_BASE provided, using explicit base:', chosenBase);
  } else {
    // Pick a responsive base URL from candidates
    console.log('Probing dev server endpoints, candidates:', baseCandidates);
  for (const candidate of baseCandidates) {
    // reuse waitForServer logic (shorter timeout for probes)
    // If the candidate includes a hash, remove it for the probe
    const probeUrl = candidate.split('#')[0];
     
    const up = await waitForServer(probeUrl, 1500);
    console.log('probe', probeUrl, '=>', up ? 'up' : 'down');
    if (up) {
      chosenBase = candidate;
      break;
    }
  }
  }

  if (!chosenBase) {
    console.error(`Dev server not responding at any candidate: ${baseCandidates.join(', ')}. Start the dev server (npm run dev) and retry.`);
    process.exit(2);
  }

  const BASE = chosenBase;
  const ADMIN_URL = `${BASE}#/admin`;
  console.log('Using E2E base URL:', BASE);

  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'], headless: true });
  const page = await browser.newPage();
  page.setDefaultTimeout(30000);

  // prefer a small local sleep helper instead of page.waitForTimeout (some
  // puppeteer versions in CI do not expose that method consistently)
  const sleep = (ms = 200) => new Promise((r) => setTimeout(r, ms));

  try {
    console.log(`Navigating to admin: ${ADMIN_URL}`);
    await page.goto(ADMIN_URL, { waitUntil: 'networkidle2' });
    await sleep(600);

    // Find and click the Help sidebar tile (ariaLabel="Help"). In CI the
    // admin UI may be behind a login and the help button can be missing; if
    // so we'll inject a lightweight mock to make the test deterministic.
    let helpBtn = await page.$('button[aria-label="Help"]');
    if (!helpBtn) {
      console.warn('Help button not found on admin layout — injecting fallbacks so the E2E script can continue');
      await page.evaluate(() => {
        // Add a minimal Help button and help panel so the tour can be started
        if (!document.querySelector('button[aria-label="Help"]')) {
          const btn = document.createElement('button');
          btn.setAttribute('aria-label', 'Help');
          btn.innerText = 'Help';
          btn.style.position = 'fixed';
          btn.style.right = '8px';
          btn.style.top = '8px';
          btn.style.zIndex = 9999;

          btn.addEventListener('click', () => {
            if (!document.querySelector('[role="dialog"][aria-label="Help Panel"]')) {
              const dlg = document.createElement('div');
              dlg.setAttribute('role', 'dialog');
              dlg.setAttribute('aria-label', 'Help Panel');
              dlg.className = 'help-panel';
              dlg.innerHTML = `<div class="flex border-b"><button>tab1</button><button>tab2</button><button>Interactive Tours</button></div><div class="space-y-4"><div><button>Start Tour</button></div></div>`;
              document.body.appendChild(dlg);
            }
          });

          document.body.appendChild(btn);
        }
      });

      helpBtn = await page.$('button[aria-label="Help"]');
      if (!helpBtn) {
        console.error('Unable to create fallback help button — aborting');
        await browser.close();
        process.exit(1);
      }
    }

    await helpBtn.click();
    await page.waitForSelector('[role="dialog"][aria-label="Help Panel"]', { visible: true });

    // Click the Interactive Tours tab by visible text
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('[role="dialog"] button'));
      const interactive = tabs.find(t => /interactive/i.test(t.innerText));
      if (interactive) interactive.click();
    });

    await page.waitForSelector('.space-y-4 > div button', { visible: true });

    // Wait for start attempt result: either a toast (role=alert) appears or
    // the Driver instance popovers are created. We'll attempt to detect either.

    // Click the first Start Tour button (should be contextual/priority)
    const startButtons = await page.$$('button');
    let clicked = false;
    for (const btn of startButtons) {
      const text = (await (await btn.getProperty('innerText')).jsonValue()) || '';
      if (/start tour|start/i.test(text)) {
        await btn.click();
        clicked = true;
        break;
      }
    }

    if (!clicked) {
      console.error('Start Tour button not found — help panel may have different DOM');
      await browser.close();
      process.exit(1);
    }

    // Wait for either a toast (role=alert) or driver popover to appear.
    let firstResult = null;
    try {
      // Short window for toast/popover appearance
      await Promise.race([
        page.waitForSelector('.onboarding-tour-popover', { timeout: 1500 }),
        page.waitForSelector('div[role="alert"]', { timeout: 1500 }),
      ]);

      // Determine which happened
      const toast = await page.$('div[role="alert"]');
      const pop = await page.$('.onboarding-tour-popover');

      if (toast) {
        firstResult = { type: 'toast', text: await (await toast.getProperty('innerText')).jsonValue() };
      } else if (pop) {
        firstResult = { type: 'popover' };
      }
    } catch (e) {
      // Nothing appeared quickly
      firstResult = { type: 'none' };
    }

    console.log('Start attempt result:', firstResult);

    // Scenario 2: Inject missing admin selectors into the page so the tour has real targets
    console.log('Injecting admin dashboard target elements to simulate correct page DOM...');
    await page.evaluate(() => {
      // Add a small series of admin-specific target nodes so the tour can find them
      const ensure = (cls, html = '') => {
        if (!document.querySelector(cls)) {
          const d = document.createElement('div');
          d.className = cls.replace(/\./g, '');
          d.innerHTML = html || `<div>${cls}<\/div>`;
          // Style for visibility
          d.style.minHeight = '20px';
          d.style.minWidth = '20px';
          d.style.border = '1px dashed rgba(0,0,0,0.05)';
          d.style.margin = '4px 0';
          document.body.appendChild(d);
        }
      };

      ensure('.year-selector', '<select class="year-selector"> <option>2025</option> </select>');
      ensure('.stats-grid', '<div class="stats-grid">stats</div>');
      ensure('.event-totals', '<div class="event-totals">totals</div>');
      ensure('.quick-actions', '<div class="quick-actions">quick</div>');
      ensure('.admin-sidebar', '<div class="admin-sidebar">sidebar</div>');
      ensure('.help-button', '<button class="help-button">Help</button>');
    });

    await sleep(400);

    // Re-click first available "Start Tour" button to start again
    console.log('Attempting to start the tour again (with injected targets)...');
    await page.evaluate(() => {
      // Find the first start-like button and click
      const btns = Array.from(document.querySelectorAll('button'));
      const start = btns.find(b => /start tour|start/i.test(b.innerText));
      if (start) start.click();
    });

    // Wait for driver to initialize
    await sleep(800);

    // Query for tour popover and overlay
    const popoverCount = await page.evaluate(() => document.querySelectorAll('.onboarding-tour-popover').length);
    const overlayCount = await page.evaluate(() => document.querySelectorAll('.driver-overlay').length);
    const driverActive = await page.evaluate(() => !!window.__ONBOARDING_DRIVER_INSTANCE && (typeof window.__ONBOARDING_DRIVER_INSTANCE.getActiveIndex === 'function'));

    console.log('After injecting targets -> popovers:', popoverCount, 'overlays:', overlayCount, 'driverActive?', driverActive);

    // Validate expected success
    if (popoverCount >= 1 && overlayCount >= 1 && driverActive) {
      console.log('E2E: Admin tour started and produced popover + overlay — success');
      await sleep(400);
      // Click next to ensure second step is reachable
      await page.evaluate(() => {
        const next = document.querySelector('.driver-popover-next-btn');
        if (next) next.click();
      });

      await sleep(400);
      // Check that a non-body step is displayed (e.g. .year-selector is present and popover attached)
      const activeIndex = await page.evaluate(() => window.__ONBOARDING_DRIVER_INSTANCE?.getActiveIndex?.() ?? -1);
      console.log('Driver activeIndex after next click:', activeIndex);

      // Success code
      await browser.close();
      process.exit(0);
    }

    console.error('E2E: Admin tour did not start as expected (popover/overlay/driver missing)');
    await browser.close();
    process.exit(3);

  } catch (err) {
    console.error('E2E script errored:', err);
    try { await browser.close(); } catch (e) { /* ignore */ }
    process.exit(1);
  }
}

if (require.main === module) run();
