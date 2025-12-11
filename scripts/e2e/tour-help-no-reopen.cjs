#!/usr/bin/env node
/*
 * E2E test: start interactive tour from outside Help (source !== 'help'),
 * finish the tour, and verify the Help panel does NOT reopen. Uses Puppeteer.
 */

const puppeteer = require('puppeteer');

// Node 18 has fetch built-in; fallback to dynamic import of node-fetch when needed
const fetchFn = async (...args) => {
  if (typeof globalThis.fetch === 'function') return globalThis.fetch(...args);
  const { default: nodeFetch } = await import('node-fetch');
  return nodeFetch(...args);
};

const DEFAULT_HOST = process.env.E2E_HOST || 'http://localhost:5173';
const baseCandidates = [
  process.env.E2E_BASE,
  `${DEFAULT_HOST}/Map`,
  `${DEFAULT_HOST}/Map/`,
  `${DEFAULT_HOST}`,
  `${DEFAULT_HOST}/index.html`,
].filter(Boolean);

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
    } catch (e) {
      /* ignore */
    }
    await new Promise((r) => setTimeout(r, 300));
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
  // If the base already includes a hash fragment, avoid appending another
  // '#/admin' (which would create an invalid URL like /Map#/admin#/admin).
  const ADMIN = base.includes('#') ? base : `${base}#/admin`;

  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: true,
  });
  const page = await browser.newPage();
  // Allow a generous default timeout for E2E actions, but avoid relying on
  // networkidle2 for initial navigation (some preview hosts keep connections
  // open). Use domcontentloaded for quicker readiness and rely on later
  // waitForSelector checks for specific UI elements.
  page.setDefaultTimeout(45000);

  // Forward page console messages to our test runner so we can see driver debug
  page.on('console', (msg) => {
    try {
      const text = msg.text();
      if (typeof text === 'string' && text.length > 0) console.log('PAGE_LOG:', text);
    } catch (e) {
      /* ignore */
    }
  });
  page.on('pageerror', (err) => {
    try {
      console.error('PAGE_ERROR:', err && err.message ? err.message : err.toString());
    } catch (e) {
      /* ignore */
    }
  });
  page.on('error', (err) => {
    try {
      console.error('PAGE_FATAL:', err && err.message ? err.message : err.toString());
    } catch (e) {
      /* ignore */
    }
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

    // If the Help panel is open for some reason, close it so we start from
    // a state where Help is not visible (we want to start the tour from outside Help)
    try {
      // Wait briefly for help button so we can interact
      await page.waitForSelector('button[aria-label="Help"]', { visible: true, timeout: 1500 });
    } catch (e) {
      const hasLogin = await page.$('form input#email');
      if (hasLogin && e2eAdminEmail && e2eAdminPassword) {
        console.log('Admin login form detected — signing in using provided E2E_ADMIN credentials');
        await page.type('#email', e2eAdminEmail, { delay: 30 });
        await page.type('#password', e2eAdminPassword, { delay: 30 });
        await page.click('button[type="submit"]');
        await page.waitForSelector('button[aria-label="Help"]', { visible: true, timeout: 6000 });
      }
    }

    // Ensure Help is not open — if it is, close it.
    const helpDialog = await page.$('[role="dialog"][aria-label="Help Panel"]');
    if (helpDialog) {
      // click close
      try {
        await page.evaluate(() => {
          const dlg = document.querySelector('[role="dialog"][aria-label="Help Panel"]');
          const btn = dlg ? dlg.querySelector('button[aria-label]') : null;
          if (btn) btn.click();
        });
        // allow it to close
        await sleep(300);
      } catch (e) {
        /* ignore */
      }
    }

    // If test helpers are available we can start the tour deterministically
    // from outside the Help panel. This ensures lastCompletedTour.source !== 'help'.
    const startedViaHelper = await page.evaluate(() => {
      try {
        if (
          window.__onboarding_test_helpers__ &&
          typeof window.__onboarding_test_helpers__.startTour === 'function'
        ) {
          try {
            window.__onboarding_test_helpers__.startTour('admin-dashboard', 'ui');
          } catch (e) {
            /* ignore */
          }
          return true;
        }
      } catch (e) {
        /* ignore */
      }
      return false;
    });

    if (!startedViaHelper) {
      // No helper available — attempt a UI-driven start from a page element outside Help.
      // This may be less deterministic, but acts as a fallback for local debug runs.
      // We'll look for a prominent "Start" button anywhere on the page that is not
      // inside a [role=dialog] (i.e. outside Help) and click it.
      const clickedOutside = await page.evaluate(() => {
        try {
          const candidates = Array.from(document.querySelectorAll('button'));
          for (const b of candidates) {
            if (b.closest('[role="dialog"]')) continue; // skip buttons in dialogs
            const txt = (b.innerText || '').toLowerCase();
            if (/start|start tour|starten/.test(txt)) {
              b.dispatchEvent(
                new MouseEvent('click', { bubbles: true, cancelable: true, composed: true }),
              );
              return true;
            }
          }
        } catch (e) {
          /* ignore */
        }
        return false;
      });

      if (!clickedOutside) {
        console.error(
          'Could not find a reliable outside-Help start button — recommend running with VITE_E2E_TEST_HELPERS=1 for deterministic checks',
        );
        await browser.close();
        process.exit(3);
      }
    }

    // If helpers were present, wait and then complete via helper to ensure we
    // mark the lastCompletedTour.source as 'ui' and not 'help'. If we started
    // using the UI fallback, completion will be UI-driven and we attempt to
    // finish via driver API if needed.
    try {
      if (startedViaHelper) {
        // Wait for the provider to record an active source and then complete
        await page.waitForFunction(
          () => window.__onboarding_test_helpers__?.getActiveSource?.() === 'ui',
          { timeout: 3000 },
        );
        // Force complete
        await page.evaluate(() => {
          try {
            window.__onboarding_test_helpers__.completeTour('admin-dashboard');
          } catch (e) {
            /* ignore */
          }
        });

        // Wait for last completed payload
        await page.waitForFunction(
          () =>
            !!window.__onboarding_last_completed__ &&
            window.__onboarding_last_completed__.id === 'admin-dashboard',
          { timeout: 3000 },
        );
        const completedDetail = await page.evaluate(() => window.__onboarding_last_completed__);
        console.log('Observed onboarding completion detail (outside help):', completedDetail);
        if (!completedDetail || completedDetail.source === 'help') {
          console.error('Completed tour source unexpectedly marked as help:', completedDetail);
        }
      }
    } catch (e) {
      /* ignore */
    }

    // For both helper and UI flows, wait for a driver instance then finish it
    // via API if it hasn't been destroyed yet.
    const waitForDriver = async (timeout = 10000) => {
      const start = Date.now();
      while (Date.now() - start < timeout) {
        const hasDriver = await page.evaluate(() => !!window.__ONBOARDING_DRIVER_INSTANCE);
        if (hasDriver) return true;
        await new Promise((r) => setTimeout(r, 150));
      }
      return false;
    };

    const driverFound = await waitForDriver(6000);
    if (!driverFound) {
      console.log(
        'No driver instance found after starting outside-Help tour — maybe it was completed via helper',
      );
    } else {
      // If driver exists, attempt to finish by moving to last step and destroying
      const total = await page.evaluate(
        () => window.__ONBOARDING_DRIVER_INSTANCE?.getConfig?.()?.steps?.length || 0,
      );
      if (total > 0) {
        await page.evaluate((last) => {
          try {
            const drv = window.__ONBOARDING_DRIVER_INSTANCE;
            drv.drive(last - 1);
            // destroy to trigger completion hooks
            setTimeout(() => {
              try {
                drv.destroy();
              } catch (e) {
                /* ignore */
              }
            }, 120);
          } catch (e) {
            /* ignore */
          }
        }, total);
      }

      // Wait for destroy
      const waitDestroyed = async (timeout = 6000) => {
        const started = Date.now();
        while (Date.now() - started < timeout) {
          const exists = await page.evaluate(() => !!window.__ONBOARDING_DRIVER_INSTANCE);
          if (!exists) return true;
          await new Promise((r) => setTimeout(r, 150));
        }
        return false;
      };

      const destroyed = await waitDestroyed(8000);
      console.log('Driver destroyed?', destroyed);
    }

    // Verify there are no leftover popovers or driver-active classes after
    // destruction — this is the core of the bug we're preventing.
    const remainingPopovers = await page.evaluate(
      () => document.querySelectorAll('.onboarding-tour-popover').length,
    );
    const bodyHasActive = await page.evaluate(() =>
      document.body.classList.contains('driver-active'),
    );

    console.log('Remaining popovers:', remainingPopovers, 'body has driver-active:', bodyHasActive);

    if (remainingPopovers > 0 || bodyHasActive) {
      console.error('Leftover driver UI detected after tour finished (outside-help flow):', {
        remainingPopovers,
        bodyHasActive,
      });
      await browser.close();
      process.exit(5);
    }

    // Ensure Help did NOT reopen — because the tour did not start from Help
    await new Promise((r) => setTimeout(r, 1200));

    const helpOpen = await page.evaluate(() => {
      const dlg = document.querySelector('[role="dialog"][aria-label="Help Panel"]');
      if (!dlg) return false;
      return !dlg.classList.contains('translate-x-full');
    });

    if (helpOpen) {
      console.error('Help unexpectedly reopened after finishing tour that started outside Help');
      await browser.close();
      process.exit(6);
    }

    // Also assert payload recorded has source !== 'help' when helper used
    const completedDetail = await page.evaluate(() => window.__onboarding_last_completed__);
    if (completedDetail && completedDetail.source === 'help') {
      console.error(
        'Completed detail incorrectly recorded as help for outside-help flow:',
        completedDetail,
      );
      await browser.close();
      process.exit(7);
    }

    console.log('E2E: PASS — Help did NOT reopen after finishing tour started from outside Help');
    await browser.close();
    process.exit(0);
  } catch (err) {
    console.error('E2E error:', err);
    try {
      await browser.close();
    } catch (e) {
      /* ignore */
    }
    process.exit(1);
  }
}

if (require.main === module) run();
