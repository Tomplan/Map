#!/usr/bin/env node
/*
  scrape_company_emails.cjs

  Scrapes company websites to find contact emails and generates SQL updates.

  Usage:
    SUPABASE_URL=... SUPABASE_KEY=... node src/scripts/scrape_company_emails.cjs [--apply]

  By default, runs in dry-run mode (generates SQL only).
  Use --apply to actually update the database.
*/

const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const dotenv = require('dotenv');
const fs = require('fs');

dotenv.config();

// Support both VITE_ prefixed and non-prefixed environment variables
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ||
                     process.env.SUPABASE_KEY ||
                     process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Please set SUPABASE_URL and SUPABASE_KEY (or VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY) in your .env file');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Email regex pattern
const EMAIL_REGEX = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;

// Common contact page paths to try
const CONTACT_PATHS = [
  '/contact',
  '/contact-us',
  '/contactus',
  '/kontakt',
  '/contact.html',
  '/contact.php',
  '/about',
  '/about-us',
  '/over-ons',
  '/impressum',
];

// Unwanted email patterns (generic/spam)
const UNWANTED_EMAILS = [
  'example.com',
  'yourdomain.com',
  'example.org',
  'sentry.io',
  'wixpress.com',
  'w3.org',
  'schema.org',
  'wordpress.com',
];

/**
 * Normalize URL to ensure it has http(s) protocol
 */
function normalizeUrl(url) {
  if (!url) return null;
  url = url.trim();
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  return url;
}

/**
 * Extract base domain from URL
 */
function getBaseDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return null;
  }
}

/**
 * Check if email is valid and not generic
 */
function isValidEmail(email, companydomain) {
  email = email.toLowerCase();

  // Check if it's a generic unwanted email
  if (UNWANTED_EMAILS.some(unwanted => email.includes(unwanted))) {
    return false;
  }

  // Prefer emails from the same domain as company website
  if (companydomain && email.includes(companydomain)) {
    return true;
  }

  // Filter out common generic emails
  if (email.startsWith('noreply@') ||
      email.startsWith('no-reply@') ||
      email.startsWith('support@') ||
      email.includes('privacy@')) {
    return false;
  }

  return true;
}

/**
 * Extract emails from HTML content
 */
function extractEmails(html, companyDomain) {
  const emails = new Set();
  const matches = html.match(EMAIL_REGEX);

  if (matches) {
    matches.forEach(email => {
      email = email.toLowerCase().trim();
      if (isValidEmail(email, companyDomain)) {
        emails.add(email);
      }
    });
  }

  return Array.from(emails);
}

/**
 * Fetch a URL with timeout and error handling
 */
async function fetchUrl(url, timeout = 10000) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CompanyEmailBot/1.0)',
      },
      redirect: 'follow',
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return null;
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('text/html')) {
      return null;
    }

    return await response.text();
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log(`  ⏱️  Timeout fetching ${url}`);
    }
    return null;
  }
}

/**
 * Find contact page URL from homepage
 */
function findContactPageUrl(html, baseUrl) {
  const $ = cheerio.load(html);
  const links = [];

  // Look for links with contact-related text or href
  $('a').each((_, elem) => {
    const href = $(elem).attr('href');
    const text = $(elem).text().toLowerCase();

    if (!href) return;

    if (text.includes('contact') ||
        text.includes('kontakt') ||
        href.toLowerCase().includes('contact') ||
        href.toLowerCase().includes('kontakt')) {
      try {
        const fullUrl = new URL(href, baseUrl);
        links.push(fullUrl.href);
      } catch {}
    }
  });

  return links[0] || null;
}

/**
 * Try to find email for a company
 */
async function findCompanyEmail(company) {
  if (!company.website) {
    return null;
  }

  const websiteUrl = normalizeUrl(company.website);
  if (!websiteUrl) {
    return null;
  }

  const baseDomain = getBaseDomain(websiteUrl);
  console.log(`\n🔍 Checking: ${company.name} (${websiteUrl})`);

  let allEmails = new Set();

  // 1. Try homepage
  console.log('  📄 Fetching homepage...');
  const homepageHtml = await fetchUrl(websiteUrl);
  if (homepageHtml) {
    const emails = extractEmails(homepageHtml, baseDomain);
    emails.forEach(e => allEmails.add(e));

    if (emails.length > 0) {
      console.log(`  ✅ Found ${emails.length} email(s) on homepage:`, emails);
    }

    // 2. Try to find contact page from links
    const contactPageUrl = findContactPageUrl(homepageHtml, websiteUrl);
    if (contactPageUrl && contactPageUrl !== websiteUrl) {
      console.log(`  📄 Found contact page: ${contactPageUrl}`);
      const contactHtml = await fetchUrl(contactPageUrl);
      if (contactHtml) {
        const contactEmails = extractEmails(contactHtml, baseDomain);
        contactEmails.forEach(e => allEmails.add(e));
        if (contactEmails.length > 0) {
          console.log(`  ✅ Found ${contactEmails.length} email(s) on contact page:`, contactEmails);
        }
      }
    }
  }

  // 3. Try common contact paths
  for (const path of CONTACT_PATHS) {
    const contactUrl = new URL(path, websiteUrl).href;
    const html = await fetchUrl(contactUrl);
    if (html) {
      const emails = extractEmails(html, baseDomain);
      if (emails.length > 0) {
        console.log(`  ✅ Found ${emails.length} email(s) at ${path}:`, emails);
        emails.forEach(e => allEmails.add(e));
        break; // Stop after first successful contact page
      }
    }
  }

  // Prefer emails from company domain
  const emailsArray = Array.from(allEmails);
  const companyDomainEmails = emailsArray.filter(e => e.includes(baseDomain));

  if (companyDomainEmails.length > 0) {
    return companyDomainEmails[0]; // Return first email from company domain
  }

  return emailsArray[0] || null; // Return any email found
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const applyChanges = args.includes('--apply');

  console.log('🚀 Company Email Scraper');
  console.log('========================\n');

  // Fetch all companies with websites but no email
  console.log('📊 Fetching companies from database...');
  const { data: companies, error } = await supabase
    .from('companies')
    .select('id, name, website, email')
    .not('website', 'is', null)
    .neq('website', '');

  if (error) {
    console.error('❌ Error fetching companies:', error);
    process.exit(1);
  }

  console.log(`✅ Found ${companies.length} companies with websites\n`);

  // Filter to only companies without email
  const companiesWithoutEmail = companies.filter(c => !c.email || c.email.trim() === '');
  console.log(`📧 ${companiesWithoutEmail.length} companies need email addresses\n`);

  const results = [];
  let successCount = 0;

  for (const company of companiesWithoutEmail) {
    try {
      const email = await findCompanyEmail(company);

      if (email) {
        results.push({ id: company.id, name: company.name, email });
        successCount++;
        console.log(`  ✨ Selected email: ${email}`);
      } else {
        console.log(`  ❌ No email found`);
      }
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
    }

    // Small delay to be polite to servers
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n' + '='.repeat(60));
  console.log(`\n📊 Summary: Found emails for ${successCount}/${companiesWithoutEmail.length} companies\n`);

  // Generate SQL
  if (results.length > 0) {
    let sql = '-- SQL Updates for Company Emails\n';
    sql += '-- Generated: ' + new Date().toISOString() + '\n\n';
    sql += 'BEGIN;\n\n';

    results.forEach(({ id, name, email }) => {
      const escapedEmail = email.replace(/'/g, "''");
      sql += `-- ${name}\n`;
      sql += `UPDATE companies SET email = '${escapedEmail}' WHERE id = ${id};\n\n`;
    });

    sql += 'COMMIT;\n';

    const filename = 'update_company_emails.sql';
    fs.writeFileSync(filename, sql);
    console.log(`✅ SQL script saved to: ${filename}\n`);

    if (applyChanges) {
      console.log('🔄 Applying changes to database...');
      for (const { id, name, email } of results) {
        const { error } = await supabase
          .from('companies')
          .update({ email })
          .eq('id', id);

        if (error) {
          console.error(`❌ Failed to update ${name}:`, error.message);
        } else {
          console.log(`✅ Updated ${name}`);
        }
      }
      console.log('\n✨ Done!');
    } else {
      console.log('ℹ️  Run with --apply to update the database');
      console.log(`ℹ️  Or run the SQL script manually: ${filename}`);
    }
  } else {
    console.log('ℹ️  No emails found to update');
  }
}

main().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
