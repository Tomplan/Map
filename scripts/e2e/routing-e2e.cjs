import puppeteer from 'puppeteer';

(async () => {
  const port = process.env.PORT || 5173;
  const host = `http://localhost:${port}`;

  const cases = [
    { in: '/Map', expectEndsWith: '/Map#/' },
    { in: '/Map#/', expectEndsWith: '/Map#/' },
    { in: '/Map/#/admin', expectEndsWith: '/Map#/admin' },
    { in: '/Map#/admin', expectEndsWith: '/Map#/admin' },
  ];

  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();

  let failed = false;

  for (const c of cases) {
    const url = `${host}${c.in}`;
    try {
      await page.goto(url, { waitUntil: 'networkidle2' });
      // Short delay for client normalization to run
      await new Promise((r) => setTimeout(r, 250));
      const final = page.url();
      if (!final.endsWith(c.expectEndsWith)) {
        console.error(`✖ ${url} -> ${final} (expected ending: ${c.expectEndsWith})`);
        failed = true;
      } else {
        console.log(`✔ ${url} -> ${final}`);
      }
    } catch (err) {
      console.error(`✖ Failed to load ${url}: ${err.message}`);
      failed = true;
    }
  }

  await browser.close();
  if (failed) process.exit(2);
  console.log('All routing checks passed.');
})();