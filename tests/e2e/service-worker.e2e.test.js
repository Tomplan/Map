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
    const timer = setTimeout(() => reject(new Error('Server did not start in time')), timeout);

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

describe('Service Worker E2E', () => {
  let browser;
  let page;
  let previewProc;

  beforeAll(async () => {
    // Ensure the production build is available and start preview server
    // Build
    await new Promise((res, rej) => {
      const b = spawn('npm', ['run', 'build'], { stdio: 'inherit' });
      b.on('exit', (code) => (code === 0 ? res() : rej(new Error('build failed'))));
    });

    // Start preview server on fixed port
    previewProc = spawn('npm', ['run', 'preview', '--', '--port', String(PREVIEW_PORT)], {
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    // Wait until server prints the local URL (match either localhost or 127.0.0.1)
    await waitForServerOutput(previewProc, new RegExp(`:${PREVIEW_PORT}`));

    browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    page = await browser.newPage();
  }, 120000);

  afterAll(async () => {
    if (browser) await browser.close();
    if (previewProc) previewProc.kill();
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
    while (Date.now() - start < 5000) {
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
    await new Promise((r) => setTimeout(r, 500));

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
  }, 30000);
});
