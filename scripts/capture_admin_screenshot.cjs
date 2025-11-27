#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const url = process.argv[2] || 'http://localhost:5173/Map#/admin';
const out = process.argv[3] || path.resolve(__dirname, '..', 'screenshots', 'admin_dashboard.png');

// Optional args (flags): --user-data-dir="/path/to/profile" --executable-path="/path/to/chrome" --headless=(true|false)
const argv = process.argv.slice(4).join(' ');
const matchUserDir = argv.match(/--user-data-dir=(".*?"|\S+)/);
const userDataDir = matchUserDir ? matchUserDir[1].replace(/^"|"$/g, '') : null;
const matchExec = argv.match(/--executable-path=(".*?"|\S+)/);
const executablePath = matchExec ? matchExec[1].replace(/^"|"$/g, '') : null;
const matchHeadless = argv.match(/--headless=(true|false)/);
const headlessArg = matchHeadless ? matchHeadless[1] === 'true' : undefined;

async function waitForServer(u, timeout = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const res = await fetch(u, { method: 'HEAD' });
      if (res && (res.ok || res.status === 200 || res.status === 404)) return true;
    } catch (e) {
      // ignore
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

(async function main() {
  try {
    const outDir = path.dirname(out);
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    // Try to wait up to 20s for the dev server
    const base = url.split('#')[0];
    const ready = await waitForServer(base);
    if (!ready) {
      console.error(`Timed out waiting for ${base} to respond`);
      process.exit(2);
    }

    const launchOptions = { args: ['--no-sandbox', '--disable-setuid-sandbox'] };
    if (typeof headlessArg !== 'undefined') launchOptions.headless = headlessArg;
    // If user supplied an executable path, try to use it
    if (executablePath) launchOptions.executablePath = executablePath;
    // If user supplied a profile dir, use it to reuse an existing session
    if (userDataDir) {
      launchOptions.userDataDir = userDataDir;
      // Typically want headed mode when reusing a profile
      if (typeof launchOptions.headless === 'undefined') launchOptions.headless = false;
    }

    const browser = await puppeteer.launch(launchOptions);
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });

    // loading URL
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    // small pause for rendering final layout
    await new Promise((r) => setTimeout(r, 800));

    await page.screenshot({ path: out, fullPage: true });
    // saved screenshot
    await browser.close();
    process.exit(0);
  } catch (err) {
    console.error('Screenshot error', err);
    process.exit(1);
  }
})();
