import puppeteer from 'puppeteer';

(async () => {
  const basePort = process.env.PORT || 5174;
  const host = `http://localhost:${basePort}`;
  const paths = ['/Map', '/Map#/admin', '/Map#/', '/Map/#/admin'];

  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();

  for (const p of paths) {
    const url = `${host}${p}`;
    try {
      await page.goto(url, { waitUntil: 'networkidle2' });
      // wait a tick for client-side normalization
      // some puppeteer versions do not expose page.waitForTimeout; use a plain delay
      await new Promise((r) => setTimeout(r, 250));
      const final = page.url();
      console.log(`${url} -> ${final}`);
    } catch (err) {
      console.error(`Failed to load ${url}:`, err.message);
    }
  }

  await browser.close();
})();
