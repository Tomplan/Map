#!/usr/bin/env node
/* Diagnostic: why are booth marker icons still visible during print? */
require('dotenv').config();
const puppeteer = require('puppeteer');

const BASE_URL = process.argv[2] || 'http://localhost:5173/#/admin/map';

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 900 });
    await page.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: 30000 });

    const emailInput = await page.$('input[type="email"]');
    if (emailInput) {
      await emailInput.type(process.env.VITE_ADMIN_EMAIL, { delay: 10 });
      await (await page.$('input[type="password"]')).type(process.env.VITE_ADMIN_PASSWORD, { delay: 10 });
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {}),
        page.click('button[type="submit"]'),
      ]);
      await page.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    }

    await page.waitForSelector('#map-container .leaflet-container', { timeout: 20000 });
    await new Promise((r) => setTimeout(r, 1200));

    await page.evaluate(() => {
      window.__held = new Promise((resolve) => {
        window.print = () => {
          window.__ready = true;
        };
      });
    });

    const actionsButton = await page.waitForSelector('xpath/.//button[contains(., "Acties")]', { timeout: 10000 });
    await actionsButton.click();
    const presetButton = await page.waitForSelector('xpath/.//button[contains(., "A4 — Portrait")]', { timeout: 10000 });
    await presetButton.click();
    await page.waitForFunction(() => window.__ready === true, { timeout: 15000 });
    await new Promise((r) => setTimeout(r, 400));

    const diag = await page.evaluate(() => {
      const c = document.querySelector('#map-container');
      const icons = [...c.querySelectorAll('.leaflet-marker-icon')];
      const visibleUnhidden = icons.filter(
        (el) => !el.classList.contains('booth-surface-print-hidden'),
      );
      const numbered = visibleUnhidden.filter((el) => /^\d+$/.test(el.textContent?.trim() || ''));
      const describe = (el) => {
        const rect = el.getBoundingClientRect();
        const ancestors = [];
        let node = el.parentElement;
        for (let i = 0; i < 6 && node; i += 1) {
          ancestors.push(node.className);
          node = node.parentElement;
        }
        return {
          text: el.textContent?.trim().slice(0, 10),
          rect: { x: Math.round(rect.x), y: Math.round(rect.y) },
          ancestors,
        };
      };
      return {
        totalIcons: icons.length,
        hiddenCount: icons.length - visibleUnhidden.length,
        unhiddenCount: visibleUnhidden.length,
        numberedUnhiddenCount: numbered.length,
        sample: numbered.slice(0, 5).map(describe),
      };
    });
    console.log('DIAG', JSON.stringify(diag, null, 2));
  } finally {
    await browser.close();
  }
})().catch((err) => {
  console.error('FAILED', err);
  process.exit(1);
});
