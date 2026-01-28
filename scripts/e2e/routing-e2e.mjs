import puppeteer from 'puppeteer';

const port = process.env.PORT || 5173;
const host = `http://localhost:${port}`;

const cases = [
  { in: '/Map', expectEndsWith: '/Map#/', type: 'normalize' },
  { in: '/Map#/', expectEndsWith: '/Map#/', type: 'normalize' },
  { in: '/Map#/map', expectEndsWith: '/Map#/map', type: 'map' },
  { in: '/Map/#/admin', expectEndsWith: '/Map#/admin', type: 'admin' },
  { in: '/Map#/admin', expectEndsWith: '/Map#/admin', type: 'admin' },
];

const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
const page = await browser.newPage();

// Forward page console / errors to the test runner logs for easier debugging
page.on('console', (m) => {
  try {
    console.log('PAGE LOG:', m.text());
  } catch (e) {}
});
page.on('pageerror', (err) => console.error('PAGE ERROR:', err && err.message ? err.message : err));

let failed = false;

for (const c of cases) {
  const url = `${host}${c.in}`;
  try {
    await page.goto(url, { waitUntil: 'networkidle2' });
    // Short delay for client normalization to run
    await new Promise((r) => setTimeout(r, 250));

    const final = page.url();

    // Verify canonical URL ending
    if (!final.endsWith(c.expectEndsWith)) {
      console.error(`✖ ${url} -> ${final} (expected ending: ${c.expectEndsWith})`);
      failed = true;
      continue;
    }

    // Additional UI assertions based on case type
    if (c.type === 'admin') {
      try {
        // Wait longer for lazily loaded admin login to appear (look for the portal paragraph element)
        await page.waitForFunction(() => {
          const p = document.querySelector('p.text-gray-500.text-sm');
          return p && p.innerText.trim().length > 0;
        }, { timeout: 7000 });
        console.log(`✔ ${url} -> ${final} (admin login visible)`);
      } catch (err) {
        console.error(`✖ ${url} -> admin UI not visible (no portal paragraph found)`);
        try {
          const body = await page.evaluate(() => document.body ? document.body.innerText.slice(0, 1000) : '');
          console.error('Body snippet:', body.replace(/\n/g, ' '));
        } catch (e) {}
        failed = true;
      }
    } else if (c.type === 'map') {
      try {
        // Navigate to the map route fragment if needed (some hosts may normalize)
        // Wait for Leaflet container to initialize
        await page.waitForSelector('.leaflet-container', { timeout: 7000 });
        console.log(`✔ ${url} -> ${final} (map rendered)`);
      } catch (err) {
        console.error(`✖ ${url} -> map did not render (no '.leaflet-container')`);
        try {
          const body = await page.evaluate(() => document.body ? document.body.innerText.slice(0, 1000) : '');
          console.error('Body snippet:', body.replace(/\n/g, ' '));
        } catch (e) {}
        failed = true;
      }
    } else {
      // normalization-only checks have already passed above
      console.log(`✔ ${url} -> ${final} (normalization)`);
    }
  } catch (err) {
    console.error(`✖ Failed to load ${url}: ${err.message}`);
    failed = true;
  }
}

await browser.close();
if (failed) process.exit(2);
console.log('All routing checks passed.');