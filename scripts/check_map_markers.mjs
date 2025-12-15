import puppeteer from 'puppeteer';

(async () => {
  const url = process.argv[2] || 'http://localhost:5173/Map';
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();

  const logs = [];
  page.on('console', (msg) => {
    logs.push({ type: msg.type(), text: msg.text() });
  });

  console.log('Opening', url);
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

  // Wait a bit for markers to render
  await page.waitForTimeout(3000);

  const markerCount = await page.evaluate(() => {
    // Leaflet places markers with class 'leaflet-marker-icon'
    return document.querySelectorAll('.leaflet-marker-icon').length;
  });

  console.log('Console logs captured:');
  logs.forEach((l) => console.log(`[${l.type}] ${l.text}`));

  console.log('Detected leaflet marker elements:', markerCount);

  await browser.close();
  process.exit(0);
})();