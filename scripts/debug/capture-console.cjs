const puppeteer = require('puppeteer');

(async () => {
  const url = process.argv[2] || 'http://localhost:5173/Map';
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();

  const logs = [];
  page.on('console', (msg) => {
    logs.push({ type: msg.type(), text: msg.text() });
    console.log(`[PAGE ${msg.type()}] ${msg.text()}`);
  });

  page.on('pageerror', (err) => {
    logs.push({ type: 'pageerror', text: err.message });
    console.error('[PAGE ERROR]', err);
  });

  try {
    console.log('Navigating to', url);
    const resp = await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });
    console.log('HTTP status:', resp && resp.status());

    // Wait a bit for app to hydrate and log
    await page.waitForTimeout(2000);

    // Take a screenshot
    await page.screenshot({ path: 'debug-screenshot.png', fullPage: true });
    console.log('Saved screenshot to debug-screenshot.png');
  } catch (err) {
    console.error('Error during page load:', err);
  } finally {
    await browser.close();
    // Exit with non-zero if any error logs found
    const hasError = logs.some((l) => l.type === 'error' || l.type === 'pageerror');
    process.exit(hasError ? 1 : 0);
  }
})();
