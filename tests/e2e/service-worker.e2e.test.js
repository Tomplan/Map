/**
 * @jest-environment node
 */
const puppeteer = require('puppeteer');
const { spawn } = require('child_process');
const fetch = require('node-fetch');

const PREVIEW_PORT = process.env.E2E_PREVIEW_PORT || 5174;
const PREVIEW_URL = `http://localhost:${PREVIEW_PORT}/`;

function waitForServerOutput(proc, regex, timeout = 60000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      // Remove listeners to avoid leaking handlers if the probe times out
      try {
        proc.stdout.off('data', onData);
        proc.stderr.off('data', onData);
      } catch (e) {
        // streams may already be closed - ignore
      }
      reject(new Error('Server did not start in time'));
    }, timeout);

    const onData = (chunk) => {
      const s = chunk.toString();
      if (regex.test(s)) {
        clearTimeout(timer);
        proc.stdout.off('data', onData);
        proc.stderr.off('data', onData);
        resolve(s);
      }
    };

    // Some tools print logs to stderr (vite sometimes prints the local URL there),
    // so listen on both stdout and stderr streams.
    proc.stdout.on('data', onData);
    proc.stderr.on('data', onData);
  });
}

// Poll the given URL until it responds with a 2xx/3xx status or timeout elapses.
async function waitForUrl(url, timeout = 120000, interval = 500) {
  const start = Date.now();

  while (Date.now() - start < timeout) {
    try {
      const res = await fetch(url, { method: 'GET' });
      if (res && typeof res.status === 'number' && res.status >= 200 && res.status < 400) {
        return true;
      }
    } catch (err) {
      // ignore and retry
    }
    await new Promise((r) => setTimeout(r, interval));
  }
  throw new Error('Server did not start in time (url probe)');
}

describe('Service Worker E2E', () => {
  let browser;
  let page;
  let previewProc;

  // Helper: wait for preview to start by watching stdout or probing the URL.
  async function waitForPreviewStart(proc, url, timeout = 180000) {
    const start = Date.now();

    const outputPromise = waitForServerOutput(proc, /Local:.*https?:\/\//i, timeout).catch(() => null);
    const urlPromise = waitForUrl(url, timeout).catch(() => null);

    // Also reject if the preview process exits early
    const exitPromise = new Promise((_, rej) => proc.on('exit', (code) => rej(new Error('preview process exited with code ' + code))));

    try {
      await Promise.race([outputPromise, urlPromise, exitPromise]);
      return true;
    } catch (err) {
      const elapsed = Math.round((Date.now() - start) / 1000);
      throw new Error(`Preview server failed to start within ${elapsed}s: ${err && err.message}`);
    }
  }

  // Allow extra time for build + preview server startup on CI runners
  beforeAll(async () => {
    // Ensure the production build is available and start preview server
    // Build
    await new Promise((res, rej) => {
      const b = spawn('npm', ['run', 'build'], { stdio: 'inherit' });
      b.on('exit', (code) => (code === 0 ? res() : rej(new Error('build failed'))));
    });

    // Start preview server on fixed port and capture stdout/stderr for debug logs
    previewProc = spawn('npm', ['run', 'preview', '--', '--port', String(PREVIEW_PORT)], {
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    previewProc.stdout.on('data', (chunk) => console.log('[preview stdout]', chunk.toString().trim()));
    previewProc.stderr.on('data', (chunk) => console.error('[preview stderr]', chunk.toString().trim()));

    // Wait until the preview server is responding on the expected URL or
    // until we see the 'Local:' line on stdout. If the process exits early
    // this will throw a helpful error and we make sure to clean up.
    try {
      await waitForPreviewStart(previewProc, PREVIEW_URL, 180000);
    } catch (err) {
      // Ensure we don't leak the process when startup fails
      try {
        if (previewProc && !previewProc.killed) previewProc.kill();
      } catch (killErr) {
        console.error('Failed to kill preview process after startup failure:', killErr);
      }
      throw err;
    }

    browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    page = await browser.newPage();
  }, 240000);

  afterAll(async () => {
    if (browser) await browser.close();
    if (previewProc) {
      try {
        if (!previewProc.killed) previewProc.kill('SIGTERM');
        // Wait briefly for the process to exit
        await new Promise((resolve) => setTimeout(resolve, 250));
      } catch (err) {
        console.error('Error killing preview process in afterAll:', err);
      }
    }
  });

  test('stores markers snapshot in precache and caches URLs on demand', async () => {
    // Navigate to the base path the app is built for (/Map/) so service worker scope matches
    await page.goto(`${PREVIEW_URL}Map/`, { waitUntil: 'load' });

    // Quick sanity: ensure service-worker.js is served (account for base path '/Map')
    const swRes = await page.goto(`${PREVIEW_URL}Map/service-worker.js`);
    expect(swRes.status()).toBe(200);

    // Poll for registration to be available (give SW time to register after load)
    let hasRegistration = false;
    const start = Date.now();
    // wait up to 30s for registration on slow CI
    while (Date.now() - start < 30000) {
      // Ask page for registration
      // Note: getRegistration() returns a promise, so we await it inside page.evaluate
      // and resolve to boolean
      hasRegistration = await page.evaluate(() =>
        navigator.serviceWorker
          .getRegistration()
          .then((r) => Boolean(r))
          .catch(() => false),
      );
      if (hasRegistration) break;
      await new Promise((r) => setTimeout(r, 200));
    }

    expect(hasRegistration).toBe(true);

    // Post STORE_SNAPSHOT message
    const sample = [{ id: 1, name: 'E2E Marker' }];
    await page.evaluate((snapshot) => {
      return navigator.serviceWorker.ready.then((reg) => {
        reg.active.postMessage({ type: 'STORE_SNAPSHOT', snapshot });
      });
    }, sample);

    // Give the service worker a moment to write to cache
    await new Promise((r) => setTimeout(r, 1000));

    // Verify the snapshot is stored in PRECACHE_NAME under '/markers-snapshot'
    const snapshotBody = await page.evaluate(() =>
      caches.open('static-assets-v1').then((c) => c.match('/markers-snapshot')).then((r) => (r ? r.text() : null)),
    );

    expect(snapshotBody).not.toBeNull();
    expect(JSON.parse(snapshotBody)).toEqual(sample);

    // Test CACHE_URLS handler - cache a known asset (use base path '/Map' so URL resolves)
    const assetPath = '/Map/index.html';
    await page.evaluate((asset) => {
      return navigator.serviceWorker.ready.then((reg) => {
        reg.active.postMessage({ type: 'CACHE_URLS', urls: [asset] });
      });
    }, assetPath);

    await new Promise((r) => setTimeout(r, 500));

    const cached = await page.evaluate(
      (asset) => caches.open('on-demand-cache').then((c) => c.match(asset)).then(Boolean),
      assetPath,
    );

    expect(cached).toBe(true);
  }, 120000);
});
