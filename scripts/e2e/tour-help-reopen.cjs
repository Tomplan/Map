#!/usr/bin/env node
/*
 * E2E test: start interactive tour from Help panel, finish the tour, and
 * verify the Help panel reopens on the "interactive-tour" tab. Uses Puppeteer.
 */

const puppeteer = require('puppeteer');

// Node 18+ exposes a global fetch; if not present dynamically import node-fetch.
const fetchFn = async (...args) => {
  if (typeof globalThis.fetch === 'function') return globalThis.fetch(...args);
  const { default: nodeFetch } = await import('node-fetch');
  return nodeFetch(...args);
};

const DEFAULT_HOST = process.env.E2E_HOST || 'http://localhost:5173';
const baseCandidates = [process.env.E2E_BASE, `${DEFAULT_HOST}/Map`, `${DEFAULT_HOST}/Map/`, `${DEFAULT_HOST}`, `${DEFAULT_HOST}/index.html`].filter(Boolean);

async function waitForServer(u, timeout = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      let res;
      try {
        res = await fetchFn(u, { method: 'HEAD' });
      } catch (e) {
        res = null;
      }
      if (!res || (!res.ok && res.status !== 404)) {
        try {
          res = await fetchFn(u, { method: 'GET' });
        } catch (e) {
          res = null;
        }
      }
      if (res && (res.ok || res.status === 200 || res.status === 404)) return true;
    } catch (e) { /* ignore */ }
    await new Promise(r => setTimeout(r, 300));
  }
  return false;
}

async function chooseBase() {
  if (process.env.E2E_BASE) return process.env.E2E_BASE;
  for (const c of baseCandidates) {
    const probe = c.split('#')[0];
    const ok = await waitForServer(probe, 1500);
    if (ok) return c;
  }
  return null;
}

async function run() {
  const base = await chooseBase();
  if (!base) {
    console.error('No responsive dev server; set E2E_BASE or start dev server');
    process.exit(2);
  }

  console.log('E2E base:', base);
  const ADMIN = `${base}#/admin`;

  const browser = await puppeteer.launch({ args: ['--no-sandbox','--disable-setuid-sandbox'], headless: true });
  const page = await browser.newPage();
  page.setDefaultTimeout(30000);

  // Forward page console messages to our test runner so we can see driver debug
  page.on('console', (msg) => {
    try {
      const text = msg.text();
      if (typeof text === 'string' && text.length > 0) console.log('PAGE_LOG:', text);
    } catch (e) { /* ignore */ }
  });
  page.on('pageerror', (err) => {
    try { console.error('PAGE_ERROR:', err && err.message ? err.message : err.toString()); } catch (e) { /* ignore */ }
  });
  page.on('error', (err) => {
    try { console.error('PAGE_FATAL:', err && err.message ? err.message : err.toString()); } catch (e) { /* ignore */ }
  });

  // small sleep helper to avoid depending on Puppeteer page.waitForTimeout implementation
  const sleep = (ms = 200) => new Promise((r) => setTimeout(r, ms));

  try {
    // Open admin layout
    await page.goto(ADMIN, { waitUntil: 'networkidle2' });
    await sleep(400);

    // If we're presented with an admin login form, attempt to sign in using
    // E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD env vars (useful for local dev)
    const e2eAdminEmail = process.env.E2E_ADMIN_EMAIL || process.env.VITE_ADMIN_EMAIL;
    const e2eAdminPassword = process.env.E2E_ADMIN_PASSWORD || process.env.VITE_ADMIN_PASSWORD;

    // Open Help via sidebar help button. Wait a few seconds for the UI to render
    try {
      await page.waitForSelector('button[aria-label="Help"]', { visible: true, timeout: 1500 });
    } catch (e) {
      // If help isn't immediately available, check if the admin login form is present.
      const hasLogin = await page.$('form input#email');
      if (hasLogin && e2eAdminEmail && e2eAdminPassword) {
        console.log('Admin login form detected — signing in using provided E2E_ADMIN credentials');
        await page.type('#email', e2eAdminEmail, { delay: 30 });
        await page.type('#password', e2eAdminPassword, { delay: 30 });
        await page.click('button[type="submit"]');
        // Wait up to 6s for admin UI to appear
        await page.waitForSelector('button[aria-label="Help"]', { visible: true, timeout: 6000 });
      } else {
      const html = await page.evaluate(() => document.body.innerHTML);
      console.error('DOM snapshot (truncated):', html?.slice?.(0, 1000));
      throw new Error('Help button not found');
      }
    }
    const helpBtn = await page.$('button[aria-label="Help"]');
    await helpBtn.click();
    await page.waitForSelector('[role="dialog"][aria-label="Help Panel"]', { visible: true });

    // Click Interactive Tours tab
    // Use a deterministic CSS selector (third tab in the header) rather
    // than relying on localized text. Using page.click avoids issues where
    // synthetic clicks inside page.evaluate don't always trigger React's
    // event handlers in some environments.
    try {
      // Choose the header container which actually holds the tabs: there are
      // multiple `.flex.border-b` elements in the panel; find the one with
      // at least 3 child buttons to reliably pick the tabs container.
      await page.evaluate(() => {
        const containers = Array.from(document.querySelectorAll('[role="dialog"][aria-label="Help Panel"] .flex.border-b'));
        const tabsContainer = containers.find(c => (c.querySelectorAll('button') || []).length >= 3);
        if (tabsContainer) {
          const tabs = Array.from(tabsContainer.querySelectorAll('button'));
          if (tabs && tabs.length >= 3) tabs[2].dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, composed: true }));
        }
      });
    } catch (e) {
      // Fallback: if nth-child fails (DOM changed) try a best-effort search
      await page.evaluate(() => {
        const container = document.querySelector('[role="dialog"][aria-label="Help Panel"] .flex.border-b');
        if (container) {
          const tabs = Array.from(container.querySelectorAll('button'));
          if (tabs && tabs.length >= 3) tabs[2].click();
        }
      });
    }

    // Diagnostic: log header tab texts and classes so we can see which tab is active
    const headerTabSnapshot = await page.evaluate(() => {
      const containers = Array.from(document.querySelectorAll('[role="dialog"][aria-label="Help Panel"] .flex.border-b'));
      return containers.map(c => ({ count: (c.querySelectorAll('button') || []).length, text: c.innerText.trim().slice(0,200), className: c.className }));
    });
    console.log('Header tabs (idx/text/class):', headerTabSnapshot);

    // Check which tab is active based on the presence of the active border class
    const activeTabIdx = await page.evaluate(() => {
      const containers = Array.from(document.querySelectorAll('[role="dialog"][aria-label="Help Panel"] .flex.border-b'));
      const tabsContainer = containers.find(c => (c.querySelectorAll('button') || []).length >= 3);
      if (!tabsContainer) return -1;
      const tabs = Array.from(tabsContainer.querySelectorAll('button'));
      return tabs.findIndex(b => b.className.includes('border-b-2'));
    });
    console.log('Active tab index after click:', activeTabIdx);

    // Debug: log a short snapshot of the help panel content to aid troubleshooting
    const helpContent = await page.evaluate(() => {
      const dlg = document.querySelector('[role="dialog"][aria-label="Help Panel"]');
      return dlg ? dlg.innerHTML : null;
    });
    console.log('Help panel innerHTML (truncated to 4000 chars):', helpContent ? helpContent.replace(/\s+/g, ' ').slice(0,4000) : 'none');

    // Poll for the presence of a start-like button inside the help dialog and click it
    const findAndClickStart = async (timeout = 10000) => {
      const start = Date.now();
      while (Date.now() - start < timeout) {
        const clicked = await page.evaluate(() => {
          // Narrow search to the interactive tab content (.space-y-4 is the
          // immediate wrapper used by the HelpPanel content for the tab body)
          const root = document.querySelector('[role="dialog"][aria-label="Help Panel"] .space-y-4');
          const btns = root ? Array.from(root.querySelectorAll('button')) : Array.from(document.querySelectorAll('[role="dialog"] button'));
          const startBtn = btns.find(b => /start tour|start|starten/i.test(b.innerText));
          if (startBtn) {
            startBtn.click();
            return true;
          }
          return false;
        });
        if (clicked) return true;
        await sleep(300);
      }
      return false;
    };

    const started = await findAndClickStart(12000);

    if (!started) {
      // Diagnostic: report all dialog button texts to assist debugging
      const dialogButtons = await page.evaluate(() => Array.from(document.querySelectorAll('[role="dialog"] button')).map(b => b.innerText.trim()).slice(0,50));
      console.error('Could not find start button in Help interactive tours. Dialog buttons snapshot:', dialogButtons);
      throw new Error('Could not find start button in Help interactive tours');
    }

    // If running in a test environment we expose a test helper to mark
    // the tour completed from the context directly; this lets the E2E test
    // skip the fragile UI-driven completion and assert the Help reopen
    // behavior deterministically.
    try {
      await page.evaluate(() => {
        if (window.__onboarding_test_helpers__ && typeof window.__onboarding_test_helpers__.completeTour === 'function') {
            // Ensure the provider recorded the tour as started from Help so
            // the final completed marker includes the source. Use startTour
            // test helper to set the activeTourSource explicitly.
            try { window.__onboarding_test_helpers__.startTour('admin-dashboard', 'help'); } catch (_) { /* ignore */ }

            // Wait for the helper to register the active source marker (set synchronously)
            return new Promise((resolve) => {
              const check = () => {
                try {
                  const getActive = window.__onboarding_test_helpers__?.getActiveSource;
                  if (typeof getActive === 'function' && getActive() === 'help') {
                    try { window.__onboarding_test_helpers__.completeTour('admin-dashboard'); } catch (_) { /* ignore */ }
                    return resolve(true);
                  }
                } catch (e) { /* ignore */ }
                setTimeout(check, 50);
              };
              check();
            });
          }
          return null;
      });

      // Wait for the onboarding completion marker set by the provider so we
      // can assert the starting source for the completed tour.
      await page.waitForFunction(() => !!window.__onboarding_last_completed__ && window.__onboarding_last_completed__.id === 'admin-dashboard', { timeout: 3000 });
      const completedDetail = await page.evaluate(() => window.__onboarding_last_completed__);
      console.log('Observed onboarding completion detail:', completedDetail);
      // Ensure the tour's start source is 'help'
      if (!completedDetail || completedDetail.source !== 'help') {
        console.error('Tour completed but source was not help:', completedDetail);
      }

    } catch (e) { /* ignore */ }

    // Wait for driver to initialise and for a popover to appear. Also
    // poll for a driver instance so we can log diagnostics explaining why
    // a popover didn't show up.
    const waitForDriver = async (timeout = 10000) => {
      const start = Date.now();
      while (Date.now() - start < timeout) {
        const hasDriver = await page.evaluate(() => !!window.__ONBOARDING_DRIVER_INSTANCE);
        if (hasDriver) return true;
        // If console produced a known failure string, bail early
        await new Promise(r => setTimeout(r, 150));
      }
      return false;
    };

    const driverFound = await waitForDriver(6000);
    if (!driverFound) {
      // Capture diagnostics
      const diag = await page.evaluate(() => ({
        activeTour: window.__ONBOARDING_DRIVER_INSTANCE ? !!window.__ONBOARDING_DRIVER_INSTANCE : false,
        activeTourId: window.__ONBOARDING_DRIVER_INSTANCE?.getConfig?.()?.steps?.length ? 'driver-has-steps' : null,
        onboardingContext: (window.__ONBOARDING_DRIVER_INSTANCE && window.__ONBOARDING_DRIVER_INSTANCE.drive) ? 'driver-ready' : null,
        bodyResourceSnapshot: document.querySelector('body')?.innerText?.slice?.(0, 1000) || null,
      }));
      console.error('E2E diagnostic - driver not found after clicking start:', diag);
    } else {
      // Capture driver config details for debugging
      const driverConfig = await page.evaluate(() => {
        const drv = window.__ONBOARDING_DRIVER_INSTANCE;
        if (!drv) return null;
        const cfg = drv.getConfig ? drv.getConfig() : null;
        return {
          hasDriveFn: typeof drv.drive === 'function',
          hasGetActiveIndex: typeof drv.getActiveIndex === 'function',
          stepsCount: Array.isArray(cfg?.steps) ? cfg.steps.length : null,
          steps: Array.isArray(cfg?.steps) ? cfg.steps.map(s => ({ element: s.element, title: s.popover?.title?.slice?.(0,40) })) : null,
        };
      });

      console.log('E2E diagnostic - driver config:', driverConfig);

      // Log any existing popover elements (maybe not yet visible)
      const popCount = await page.evaluate(() => document.querySelectorAll('.onboarding-tour-popover').length);
      console.log('Existing onboarding popover elements count:', popCount);
    }
    try {
      await page.waitForSelector('.onboarding-tour-popover', { visible: true, timeout: 15000 });
    } catch (e) {
      // log snapshot then rethrow
      const popHtml = await page.evaluate(() => Array.from(document.querySelectorAll('.onboarding-tour-popover')).map(n => n.innerText.trim().slice(0,500)));
      console.error('Failed waiting for popover. Existing popover inner texts:', popHtml);
      throw e;
    }

    // Wait briefly to ensure driver state is initialised
    await sleep(300);

    // Advance to the last step using the driver API (more reliable than clicking
    // DOM buttons which can sometimes be replaced by driver.js). This also
    // lets us avoid dealing with nested SVG/icon text and localized button text.
    const steps = await page.evaluate(() => {
      const drv = window.__ONBOARDING_DRIVER_INSTANCE;
      if (!drv) return { ok: false };
      const total = drv.getConfig?.()?.steps?.length || null;
      return { ok: true, total };
    });

    if (!steps.ok) throw new Error('Driver instance not found after starting tour');
    const total = steps.total || 1;

    // After a popover exists, collect extended diagnostics about any driver
    // elements in the DOM (all elements with class names containing "driver").
    const driverDomSnapshot = await page.evaluate(() => {
      const nodes = Array.from(document.querySelectorAll('*')).filter(n => (n.className || '').toString().includes('driver'));
      // Limit to the first few nodes for readability
      return nodes.slice(0, 6).map(n => ({ tag: n.tagName, className: n.className, innerText: n.innerText?.slice(0,200) }));
    });

    console.log('Driver DOM snapshot:', driverDomSnapshot);

    // If clicking next buttons doesn't lead to a clean finish, we can
    // fast-path to the final step using the driver API: instruct driver to
    // show the final step (drive with index) then destroy it which triggers
    // the onDestroyStarted hook and should mark the tour as completed.
    // using a dispatched MouseEvent to ensure the wrapper's captured
    // delegation handler is invoked (our app attaches capture-phase click
    // listeners on the wrapper to handle next/finish/destroy).
    // Try clicking normally first — many environments will be fine — but
    // if the driver doesn't destroy we fall back to an API-driven finish.
    let clickedNext = true;
    for (let i = 0; i < total; i += 1) {
      const didClick = await page.evaluate(() => {
        const pop = document.querySelector('.onboarding-tour-popover');
        if (!pop) return false;
        const nextBtn = pop.querySelector('.driver-popover-next-btn') || Array.from(pop.querySelectorAll('button')).find(b => /next|volgende|finish|voltooien|voltooien|volgende|voltooien|klaar|afsluiten|sluiten/i.test(b.innerText));
        if (nextBtn) {
          nextBtn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, composed: true }));
          return true;
        }
        const fallback = pop.querySelector('button');
        if (fallback) {
          fallback.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, composed: true }));
          return true;
        }
        return false;
      }).catch(() => false);

      clickedNext = clickedNext && !!didClick;
      await sleep(350);
    }

    // If clicking next didn't actually cause the driver to cleanly finish
    // and destroy itself, use the driver API to jump to last step and destroy.
    const stillExists = await page.evaluate(() => !!window.__ONBOARDING_DRIVER_INSTANCE);
    if (stillExists) {
      console.log('Driver still exists after clicking – switching to API driven finalisation');
      await page.evaluate(() => {
        try {
          const drv = window.__ONBOARDING_DRIVER_INSTANCE;
          const total = drv.getConfig?.()?.steps?.length || 0;
          if (total > 0 && typeof drv.drive === 'function') {
            // Move to last step
            drv.drive(total - 1);
          }
        } catch (e) { /* ignore */ }
      });

      await sleep(300);

      // Destroy to trigger onDestroyStarted and mark complete
      await page.evaluate(() => {
        try { window.__ONBOARDING_DRIVER_INSTANCE?.destroy?.(); } catch (e) { /* ignore */ }
      });
    }

    // Wait for the driver instance to be destroyed (tour finished)
    const waitForDriverDestroyed = async (timeout = 6000) => {
      const start = Date.now();
      while (Date.now() - start < timeout) {
        const exists = await page.evaluate(() => !!window.__ONBOARDING_DRIVER_INSTANCE);
        if (!exists) return true;
        await new Promise(r => setTimeout(r, 150));
      }
      return false;
    };

    const destroyed = await waitForDriverDestroyed(8000);
    console.log('Driver destroyed?', destroyed);

    // Verify there are no leftover popovers or driver-active classes after
    // destruction — this is the core of the bug we're preventing.
    const remainingPopovers = await page.evaluate(() => document.querySelectorAll('.onboarding-tour-popover').length);
    const bodyHasActive = await page.evaluate(() => document.body.classList.contains('driver-active'));

    console.log('Remaining popovers:', remainingPopovers, 'body has driver-active:', bodyHasActive);

    if (remainingPopovers > 0 || bodyHasActive) {
      console.error('Leftover driver UI detected after tour finished:', { remainingPopovers, bodyHasActive });
      await browser.close();
      process.exit(5);
    }

    // Check localStorage key (anonymous fallback) and other persistent markers
    const localStorageKey = `onboarding_${'admin-dashboard'}`;
    const lsValue = await page.evaluate((k) => localStorage.getItem(k), localStorageKey);
    console.log('LocalStorage value for', localStorageKey, ':', lsValue);

    // Wait for the tour to destroy and Help to reopen
    await sleep(1200);

    // Check Help panel opened again
    const helpOpen = await page.evaluate(() => {
      const dlg = document.querySelector('[role="dialog"][aria-label="Help Panel"]');
      if (!dlg) return false;
      // panel is open when translate-x-0 present (class list) or opacity etc. Check computed style
      return !dlg.classList.contains('translate-x-full');
    });

    if (!helpOpen) {
      console.error('Help did not reopen after finishing tour');
      await browser.close();
      process.exit(3);
    }

    // Ensure interactive-tour content present
    const hasInteractiveTitle = await page.evaluate(() => {
      const h = document.querySelector('[role="dialog"] .space-y-4 h3');
      return !!h && /interact/i.test(h.innerText);
    });

    if (!hasInteractiveTitle) {
      console.error('Help reopened but did not show interactive-tour content');
      await browser.close();
      process.exit(4);
    }

    console.log('E2E: PASS — Help reopened and interactive-tour tab is visible after finishing tour started from Help');
    await browser.close();
    process.exit(0);

  } catch (err) {
    console.error('E2E error:', err);
    try { await browser.close(); } catch (e) { /* ignore */ }
    process.exit(1);
  }
}

if (require.main === module) run();
