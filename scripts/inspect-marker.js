import puppeteer from 'puppeteer';

(async () => {
  const url = process.env.URL || 'http://localhost:5173/Map';
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

    // Wait for marker DOM
    await page.waitForSelector('.leaflet-marker-icon, .marker-icon', { timeout: 20000 });

    // Grab info about the first visible marker
    const info = await page.evaluate(() => {
      function getComputed(el, prop) {
        try {
          const cs = window.getComputedStyle(el);
          return cs ? cs.getPropertyValue(prop) : null;
        } catch (e) {
          return null;
        }
      }

      const el = document.querySelector('.leaflet-marker-icon, .marker-icon');
      if (!el) return { error: 'no marker element found' };

      const rect = el.getBoundingClientRect();
      const html = el.outerHTML;
      const bg = getComputed(el, 'background-image');
      const bgSize = getComputed(el, 'background-size');
      const classes = el.className;
      const svg = el.querySelector ? (el.querySelector('svg') ? el.querySelector('svg').outerHTML : null) : null;
      const img = el.querySelector ? (el.querySelector('img') ? el.querySelector('img').src : null) : null;

      return { html, bg, bgSize, classes, rect, svg, img };
    });

    console.log('MARKER INFO:', JSON.stringify(info, null, 2));
    await browser.close();
    process.exit(0);
  } catch (err) {
    console.error('Error inspecting marker:', err);
    await browser.close();
    process.exit(2);
  }
})();
