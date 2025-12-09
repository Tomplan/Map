import puppeteer from 'puppeteer';

(async () => {
  const url = process.env.URL || 'http://localhost:5173/Map';
  const out = process.env.OUT || 'prints/snapshot.pdf';

  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  try {
    const page = await browser.newPage();
    page.setViewport({ width: 1280, height: 800 });
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

    // Wait for map and at least one marker to render
    await page.waitForSelector('.leaflet-marker-icon, .marker-icon', { timeout: 20000 });

    // Give the map a little extra time to render icons
    await page.waitForTimeout(1200);

    // Print to PDF
    await page.pdf({ path: out, printBackground: true, format: 'A4' });

    console.log('Saved print snapshot to', out);
  } catch (err) {
    console.error('Error generating print snapshot:', err);
    process.exitCode = 2;
  } finally {
    await browser.close();
  }
})();
