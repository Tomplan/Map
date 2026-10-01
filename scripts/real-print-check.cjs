#!/usr/bin/env node
/* Verifies real A4 print output using Puppeteer's bundled Chromium (real Blink print pipeline). */
require('dotenv').config();
const puppeteer = require('puppeteer');

const BASE_URL = process.argv[2] || 'http://localhost:5173/#/admin/map';
const PDF_OUT = process.argv[3] || '/tmp/real-a4-print.pdf';
const PRESET_LABEL = process.argv[4] || 'A4 — Portrait';

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 900 });

    page.on('console', (msg) => console.log('[page]', msg.text()));
    page.on('pageerror', (err) => console.log('[pageerror]', err.message));

    await page.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: 30000 });

    // Log in if the login form is present.
    const emailInput = await page.$('input[type="email"]');
    if (emailInput) {
      await emailInput.type(process.env.VITE_ADMIN_EMAIL, { delay: 10 });
      const passInput = await page.$('input[type="password"]');
      await passInput.type(process.env.VITE_ADMIN_PASSWORD, { delay: 10 });
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {}),
        page.click('button[type="submit"]'),
      ]);
      await page.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    }

    await page.waitForSelector('#map-container .leaflet-container', { timeout: 20000 });
    await new Promise((r) => setTimeout(r, 1200));

    // Hold window.print() open so we can snapshot the prepared print DOM via a real PDF render.
    await page.evaluate(() => {
      window.__realPrintHeld = new Promise((resolve) => {
        window.print = () => {
          window.__printIsReady = true;
          window.__resolvePrintHold = resolve;
        };
      });
    });

    const actionsButton = await page.waitForSelector('xpath/.//button[contains(., "Acties")]', {
      timeout: 10000,
    });
    await actionsButton.click();

    const presetButton = await page.waitForSelector(
      `xpath/.//button[contains(., "${PRESET_LABEL}")]`,
      { timeout: 10000 },
    );
    await presetButton.click();

    await page.waitForFunction(() => window.__printIsReady === true, { timeout: 15000 });
    await new Promise((r) => setTimeout(r, 300));

    const prepState = await page.evaluate(() => {
      const c = document.querySelector('#map-container');
      const labels = [...c.querySelectorAll('.booth-surface-print-label')];
      return {
        bodyClass: document.body.className,
        size: c.getBoundingClientRect(),
        labelCount: labels.length,
      };
    });
    console.log('PREP_STATE', JSON.stringify(prepState));

    // Real Blink print renderer — this is the same engine behind the native print dialog.
    await page.pdf({ path: PDF_OUT, format: 'A4', printBackground: true, preferCSSPageSize: true });
    console.log('PDF_WRITTEN', PDF_OUT);

    await page.evaluate(() => {
      window.__resolvePrintHold?.();
      window.dispatchEvent(new Event('afterprint'));
    });
    await new Promise((r) => setTimeout(r, 500));
  } finally {
    await browser.close();
  }
})().catch((err) => {
  console.error('REAL_PRINT_CHECK_FAILED', err);
  process.exit(1);
});
