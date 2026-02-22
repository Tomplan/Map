const puppeteer = require('puppeteer');

(async () => {
  const url = process.env.URL || 'http://localhost:5173/Map/#/admin/map';
  console.log('Puppeteer checking', url);
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();

  page.on('console', (msg) => msg.args().map(a => a.jsonValue()).forEach(p => p.then(v => console.log('PAGE LOG:', v)).catch(()=>{})));
  page.on('pageerror', err => console.error('PAGE ERROR:', err));

  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
  } catch (err) {
    console.error('Navigation error:', err.message);
    await browser.close();
    process.exit(2);
  }

  const state = await page.evaluate(() => {
    const Lp = !!window.L;
    const browserPrint = !!(window.L && window.L.browserPrint);
    const maps = (window.L && window.L._maps) ? Object.values(window.L._maps) : [];
    const map = maps[0] || null;
    const printControl = map ? map.printControl : null;
    return {
      L_present: Lp,
      browserPrint_present: browserPrint,
      maps_count: maps.length,
      map_has_printControl: !!printControl,
      map_printControl_options: printControl ? printControl.options : null,
    };
  });

  console.log('State:', state);
  await browser.close();
})();
