import puppeteer from 'puppeteer';

const port = process.env.PORT || 5173;
const host = `http://localhost:${port}`;
const url = `${host}/Map#/admin`;

const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
const page = await browser.newPage();

let failed = false;

try {
  await page.goto(url, { waitUntil: 'networkidle2' });
  // wait for admin login to be visible (portal paragraph present)
  await page.waitForFunction(() => !!document.querySelector('p.text-gray-500.text-sm'), { timeout: 5000 });

  // Find the portal paragraph (p immediately after the h1 with event name)
  const getPortalText = async () =>
    await page.evaluate(() => {
      const h1 = Array.from(document.querySelectorAll('h1')).find((el) => el.innerText.trim().length > 0);
      if (!h1) return '';
      const p = h1.nextElementSibling;
      return p ? p.innerText.trim() : '';
    });

  // Show initial portal text
  const before = await getPortalText();
  const i18nBefore = await page.evaluate(() => {
    const i = window.__i18n || window.i18n || window.i18next;
    return {
      lang: i?.language || null,
      portalInNl: i?.store?.data?.nl?.translation?.adminLogin?.portal || null,
      portalInEn: i?.store?.data?.en?.translation?.adminLogin?.portal || null,
    };
  });
  console.log('Portal before click:', before, 'i18n before:', i18nBefore);

  // Click the Nederlands language button in LanguageToggle by finding a button with that text
  const clicked = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find((el) => el.textContent.includes('Nederlands'));
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });

  if (!clicked) {
    console.error('✖ Nederlands language button not found');
    failed = true;
  } else {
    // Wait for translation to apply
    await new Promise((r) => setTimeout(r, 500));

      // Show portal text after click
    const after = await getPortalText();
    const i18nAfter = await page.evaluate(() => {
      const i = window.__i18n || window.i18n || window.i18next;
      return {
        lang: i?.language || null,
        portalInNl: i?.store?.data?.nl?.translation?.adminLogin?.portal || null,
        portalInEn: i?.store?.data?.en?.translation?.adminLogin?.portal || null,
        tPortalDefaultNl: i ? i.t('adminLogin.portal', { lng: 'nl' }) : null,
      };
    });
    console.log('Portal after click:', after, 'i18n after:', i18nAfter);

    // Dump header container HTML for debugging
    const headerHtml = await page.evaluate(() => {
      const h1 = Array.from(document.querySelectorAll('h1')).find((el) => el.innerText.trim().length > 0);
      if (!h1) return '';
      const container = h1.parentElement;
      return container ? container.innerHTML : '';
    });
    console.log('Header container HTML:', headerHtml.slice(0, 500));

    // List other small paragraph texts (for debugging duplicate items)
    const smallPs = await page.evaluate(() => Array.from(document.querySelectorAll('p.text-gray-500.text-sm')).map(p => p.innerText.trim()));
    console.log('Small p texts:', smallPs);

    // Check that the Nederlands button shows active state after single click
    const nlPressed = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find((el) => el.textContent.includes('Nederlands'));
      return btn ? btn.getAttribute('aria-pressed') : null;
    });
    console.log('Nederlands aria-pressed after click:', nlPressed);

    // Assert portal text changed
    if (after !== 'Portaal voor managers') {
      console.error('✖ Portal text not translated to Dutch after clicking Nederlands button');
      const bodyText = await page.evaluate(() => document.body.innerText);
      console.error('Body snippet:', bodyText.slice(0, 400));
      failed = true;
    } else {
      console.log('✔ Portal translated to Dutch (Portaal voor managers)');
    }

    // Also check footer
    const bodyText = await page.evaluate(() => document.body.innerText);
    if (!bodyText.includes('Alleen beveiligde toegang voor managers')) {
      console.error('✖ Footer text not translated to Dutch');
      failed = true;
    } else {
      console.log('✔ Footer translated to Dutch (Alleen beveiligde toegang voor managers)');
    }
  }
} catch (err) {
  console.error('✖ E2E test error:', err.message);
  failed = true;
}

await browser.close();
if (failed) process.exit(2);
console.log('Admin language e2e check passed.');