const net = require('net');

async function waitForPort(host, port, timeout = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    await new Promise((res) => setTimeout(res, 250));
    try {
      await new Promise((resolve, reject) => {
        const sock = net.createConnection(port, host, () => {
          sock.destroy();
          resolve();
        });
        sock.on('error', reject);
      });
      return true;
    } catch (e) {
      // still trying
    }
  }
  return false;
}

(async () => {
  console.log('Script starting: diagnostics enabled');
  process.on('SIGINT', () => {
    console.log('Script interrupted (SIGINT)');
    process.exit(130);
  });
  process.on('SIGTERM', () => {
    console.log('Script terminated (SIGTERM)');
    process.exit(143);
  });

  const host = process.env.HOST || '127.0.0.1';
  const port = process.env.PORT ? Number(process.env.PORT) : 5173;
  const base = process.env.URL_BASE || `/Map`;
  let url = process.env.URL || `http://${host}:${port}${base}/#/admin/map`;
  // If a URL was provided but doesn't include a hash route, append the admin map fragment
  if (process.env.URL && !process.env.URL.includes('#')) {
    url = process.env.URL.replace(/\/$/, '') + '/#/admin/map';
  }
  console.log('Opening', url);

  const ready = await waitForPort(host, port, 20000);
  if (!ready) {
    console.error(`Server not reachable at ${host}:${port} after timeout`);
    process.exit(2);
  }

  // Removed Puppeteer-related code to simplify the workflow

  // Extra diagnostics: page URL, title, and a short body snippet to detect redirects/login pages
  const pageInfo = await page.evaluate(() => ({
    href: location.href,
    title: document.title,
    bodySnippet: document.body ? document.body.innerText.slice(0, 1000) : null,
  }));
  console.log('Page info:', pageInfo);
  // If we landed on a login/manager portal, optionally attempt login using env vars
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const foundLoginForm = await page.evaluate(() => {
    const email = document.querySelector('input[type="email"], input[name="email"], input[id*=email], input[placeholder*="E-mail"], input[placeholder*="Email"]');
    const pass = document.querySelector('input[type="password"], input[name="password"], input[id*=password], input[placeholder*="Wachtwoord"], input[placeholder*="Password"]');
    return !!(email && pass);
  });

  if (foundLoginForm) {
    if (adminEmail && adminPassword) {
      console.log('Login form detected — attempting sign-in with provided ADMIN_EMAIL/ADMIN_PASSWORD');
      // Fill and submit login form
      const emailHandle = await (await Promise.all([
        page.$('input[type="email"]'),
        page.$('input[name="email"]'),
        page.$('input[id*=email]'),
      ])).find(Boolean);
      const passHandle = await (await Promise.all([
        page.$('input[type="password"]'),
        page.$('input[name="password"]'),
        page.$('input[id*=password]'),
      ])).find(Boolean);
      if (emailHandle && passHandle) {
        await emailHandle.click({ clickCount: 3 });
        await emailHandle.type(adminEmail, { delay: 20 });
        await passHandle.click({ clickCount: 3 });
        await passHandle.type(adminPassword, { delay: 20 });

        // Submit
        const buttons = await page.$$('button, input[type=submit]');
        let clicked = false;
        for (const b of buttons) {
          try {
            const txt = (await (await b.getProperty('innerText')).jsonValue()) || '';
            if (/inloggen|login|sign in/i.test(txt)) {
              await b.click();
              clicked = true;
              break;
            }
          } catch (e) {}
        }
        if (!clicked && buttons.length) await buttons[0].click();

        // Wait for navigation or for the app to render map container
        await Promise.race([
          page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {}),
          page.waitForSelector('#map-container, .leaflet-container', { timeout: 15000 }).catch(() => {}),
        ]);

        // Small delay for app initialization
        await new Promise((r) => setTimeout(r, 1500));

        // Inspect post-login state
        const postAuthState = await page.evaluate(() => {
          const Lp = !!window.L;
          const maps = (window.L && window.L._maps) ? Object.values(window.L._maps) : [];
          return {
            L_present: Lp,
            maps_count: maps.length,
            selectedEventYear: window.localStorage.getItem('selectedEventYear'),
            eventMarkers: (() => { try { return JSON.parse(window.localStorage.getItem('eventMarkers')||'null'); } catch(e) { return null; } })(),
            localStorageKeys: Object.keys(window.localStorage || {}).slice(0,50),
          };
        });
        console.log('Post-auth state:', postAuthState);

        // If no maps, try to set selectedEventYear from eventMarkers and navigate to admin map
        if (postAuthState.maps_count === 0) {
          const setYearResult = await page.evaluate(() => {
            try {
              const markers = JSON.parse(window.localStorage.getItem('eventMarkers') || 'null');
              const year = markers && markers.length ? (markers[0].event_year || markers[0].eventYear || null) : null;
              if (year) {
                const sel = document.querySelector('#sidebar-year-select');
                if (sel) {
                  sel.value = String(year);
                  sel.dispatchEvent(new Event('change', { bubbles: true }));
                  return { action: 'set-select', year };
                }
                window.localStorage.setItem('selectedEventYear', String(year));
                return { action: 'set-localstorage', year };
              }
              return { action: 'no-year' };
            } catch (e) { return { error: String(e) }; }
          });
          console.log('Set year result:', setYearResult);

          // Attempt to click Admin Map tile, then navigate to ensure route is active
          await page.evaluate(() => {
            const admin = Array.from(document.querySelectorAll('a, button')).find(el => (el.getAttribute && el.getAttribute('href') && el.getAttribute('href').includes('/admin/map')) || (el.innerText && /map management|map|plattegrond/i.test(el.innerText)));
            if (admin) admin.click();
          });

          // Force navigation to the admin map route to ensure the component mounts
          try {
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 10000 });
          } catch (e) {
            // ignore navigation errors
          }

          // Wait longer for map to appear
          await page.waitForSelector('#map-container, .leaflet-container', { timeout: 20000 }).catch(() => {});
        }
      } else {
        console.log('Login fields not found via selectors — manual login required');
      }
    } else {
      console.log('Login form detected — set ADMIN_EMAIL and ADMIN_PASSWORD to let script sign in automatically');
    }
  }

  // Try to open header print menu
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent && b.textContent.trim().startsWith('Print Map'));
    if (btn) btn.click();
  });

  // Wait a bit for menu
  await new Promise((r) => setTimeout(r, 500));

  // Capture menu items
  const menuItems = await page.evaluate(() => {
    const menu = document.querySelector('div[role="menu"]') || document.querySelector('.absolute .w-56');
    if (!menu) return null;
    return Array.from(menu.querySelectorAll('button')).map((b) => ({ text: b.textContent.trim() }));
  });

  console.log('Menu items:', menuItems);

  // If presets, click the first preset
  const clicked = await page.evaluate(() => {
    const menu = document.querySelector('div[role="menu"]') || document.querySelector('.absolute .w-56');
    if (!menu) return 'no-menu';
    const btn = menu.querySelector('button');
    if (!btn) return 'no-button';
    btn.click();
    return 'clicked';
  });

  console.log('Clicked preset result:', clicked);

  // Wait for plugin events to fire - instrument map events
  const events = await page.evaluate(() => new Promise((resolve) => {
    const maps = (window.L && window.L._maps) ? Object.values(window.L._maps) : [];
    const map = maps[0];
    if (!map) return resolve({ error: 'no-map' });
    const Ev = (window.L && window.L.BrowserPrint && window.L.BrowserPrint.Event) ? window.L.BrowserPrint.Event : null;
    if (!Ev) return resolve({ error: 'no-Ev' });

    const res = [];
    const on = (name) => (e) => { res.push(name); if (name === 'PrintEnd' || res.length > 5) { cleanup(); resolve({ events: res }); } };
    const cleanup = () => {
      try { map.off(Ev.PrintStart, on('PrintStart')); map.off(Ev.Print, on('Print')); map.off(Ev.PrintEnd, on('PrintEnd')); map.off(Ev.PrintCancel, on('PrintCancel')); } catch (e) {}
    };
    map.on(Ev.PrintStart, on('PrintStart'));
    map.on(Ev.Print, on('Print'));
    map.on(Ev.PrintEnd, on('PrintEnd'));
    map.on(Ev.PrintCancel, on('PrintCancel'));

    // Also set a timeout to resolve
    setTimeout(() => { cleanup(); resolve({ events: res, timeout: true }); }, 5000);
  }));

  console.log('Captured events:', events);

  // Removed browser closing code for long-running script
})();