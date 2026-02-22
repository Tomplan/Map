#!/usr/bin/env node
const puppeteer = require('puppeteer');

(async () => {
  const url = process.argv[2] || 'http://localhost:5174/Map/';
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: true,
  });
  const page = await browser.newPage();
  const requests = [];

  page.on('request', (req) => {
    requests.push({
      url: req.url(),
      method: req.method(),
      resourceType: req.resourceType(),
    });
  });

  page.on('requestfailed', (req) => {
    requests.push({ url: req.url(), failed: true, resourceType: req.resourceType() });
  });

  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    // some puppeteer versions don't expose waitForTimeout on the Page API
    await (page.waitForTimeout ? page.waitForTimeout(1000) : new Promise((r) => setTimeout(r, 1000)));
    console.log(JSON.stringify(requests, null, 2));
  } catch (err) {
    console.error('Error capturing network:', err.message || err);
    process.exitCode = 2;
  } finally {
    await browser.close();
  }
})();
