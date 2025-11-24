#!/usr/bin/env node
/*
 * scrape_company_descriptions.cjs
 *
 * Fetch company website pages (root + language variants) and extract a candidate
 * short description / main-purpose text for NL / EN / DE.
 *
 * Usage:
 *  - With Supabase: set SUPABASE_URL and SUPABASE_KEY (service role or anon key) in env
 *      node src/scripts/scrape_company_descriptions.cjs --dry-run --output out.json
 *  - With a local companies JSON file (array of objects with id,name,website):
 *      node src/scripts/scrape_company_descriptions.cjs --input ./data/companies.json --output out.json
 *
 * The script does NOT write to your database. It produces a JSON file listing
 * discovered descriptions for approval. Once approved we can run a separate
 * script to persist to Supabase (requires service role key).
 */

import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function fetchUrl(url) {
  try {
    const res = await fetch(url, { redirect: 'follow', headers: { 'User-Agent': 'map-scraper/1.0 (+https://github.com/Tomplan/Map)' }, timeout: 15000 });
    if (!res.ok) return { error: `HTTP ${res.status}` };
    const text = await res.text();
    return { text, finalUrl: res.url };
  } catch (err) {
    return { error: String(err) };
  }
}

function extractDescription(html) {
  if (!html) return null;
  // Try common meta tags first
  const metaDesc = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/i);
  if (metaDesc && metaDesc[1]) return metaDesc[1].trim();

  const og = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["'][^>]*>/i);
  if (og && og[1]) return og[1].trim();

  // Common about / mission patterns: try <section id="about"> or <div class="about">
  const aboutSection = html.match(/<(?:section|div)[^>]*(?:id|class)=["'][^"']*(about|mission|what-we-do|purpose|company|over-ons|uber-uns)[^"']*["'][^>]*>([\s\S]{10,800})<\/(?:section|div)>/i);
  if (aboutSection && aboutSection[2]) {
    // Remove markup and truncate
    const plain = aboutSection[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    return plain.split('. ').slice(0, 2).join('. ').trim();
  }

  // Fallback: first <p> in <main> or body
  const mainParagraph = html.match(/<main[^>]*>[\s\S]*?<p[^>]*>([\s\S]{20,400}?)<\/p>/i)
    || html.match(/<body[^>]*>[\s\S]*?<p[^>]*>([\s\S]{20,400}?)<\/p>/i);
  if (mainParagraph && mainParagraph[1]) {
    const plain = mainParagraph[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    return plain.split('. ').slice(0, 2).join('. ').trim();
  }

  return null;
}

async function probeSite(baseUrl) {
  // Normalise URL
  if (!baseUrl) return { error: 'missing website' };
  let url = baseUrl;
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;

  // Try variants in order: /nl /en /de then fallback to /about and root
  const candidatePaths = ['/', '/nl', '/en', '/de', '/about', '/en/about', '/nl/over-ons', '/de/ueber-uns', '/about-us'];

  const results = {};

  for (const p of candidatePaths) {
    const full = new URL(p, url).toString();
    // Avoid repeating the root when p === '/'
    const { text, finalUrl, error } = await fetchUrl(full);
    if (error) {
      results[full] = { ok: false, error };
    } else {
      const desc = extractDescription(text);
      results[full] = { ok: true, finalUrl, description: desc || null };
    }
    // Be gentle with remote servers
    await sleep(200);
  }

  return results;
}

function chooseByLanguage(results) {
  // Simple heuristic: prefer path containing /nl for NL, /de for DE, /en or root for EN.
  const out = { nl: null, en: null, de: null };
  for (const [url, r] of Object.entries(results)) {
    if (!r.ok || !r.description) continue;
    const lower = url.toLowerCase();
    if (!out.nl && lower.includes('/nl')) out.nl = { url, text: r.description };
    if (!out.de && (lower.includes('/de') || lower.includes('ueber') || lower.includes('uber'))) out.de = { url, text: r.description };
    if (!out.en && (lower.includes('/en') || lower.includes('about') || lower === '/')) out.en = { url, text: r.description };
  }
  // Fallbacks: if any is still null, try root results
  for (const [url, r] of Object.entries(results)) {
    if (!r.ok || !r.description) continue;
    if (!out.en) out.en = { url, text: r.description };
    if (!out.nl && r.description) out.nl = { url, text: r.description };
    if (!out.de && r.description) out.de = { url, text: r.description };
  }

  return out;
}

async function main(argv) {
  const args = argv.slice(2);
  const opts = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--input') opts.input = args[++i];
    if (args[i] === '--output') opts.output = args[++i];
    if (args[i] === '--dry-run') opts.dry = true;
  }

  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL_PUBLIC;
  const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;

  let companies = [];

  if (opts.input) {
    const p = path.resolve(opts.input);
    if (!fs.existsSync(p)) {
      console.error('Input file not found:', p);
      process.exit(1);
    }
    companies = JSON.parse(fs.readFileSync(p, 'utf8'));
  } else if (SUPABASE_URL && SUPABASE_KEY) {
    // Lazy import to avoid a dependency if not used
    const { createClient } = await import('@supabase/supabase-js');
    const client = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });
    console.log('Loading companies from Supabase...');
    const { data, error } = await client.from('companies').select('id,name,website').order('name', { ascending: true });
    if (error) {
      console.error('Supabase error:', error.message || error);
      process.exit(1);
    }
    companies = data || [];
  } else {
    console.error('No input file and no Supabase keys provided. Either pass --input or set SUPABASE_URL and SUPABASE_KEY.');
    process.exit(1);
  }

  console.log(`Found ${companies.length} companies — probing websites (this may take a while)`);

  const results = [];
  for (const c of companies) {
    if (!c.website) {
      results.push({ id: c.id, name: c.name, website: c.website || null, error: 'no website' });
      continue;
    }
    console.log('Probing', c.website);
    const r = await probeSite(c.website);
    const picked = chooseByLanguage(r);
    results.push({ id: c.id, name: c.name, website: c.website, sources: r, picked });
    // Gentle throttle
    await sleep(300);
  }

  const outPath = opts.output || path.join(__dirname, '..', '..', 'out', `company_descriptions_${Date.now()}.json`);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2), 'utf8');

  console.log('Done — results written to', outPath);
  if (opts.dry) console.log('Dry run: no database writes were performed');
}

if (import.meta.url === `file://${process.argv[1]}` || !import.meta.url.startsWith('file:')) {
  main(process.argv).catch((err) => { console.error(err); process.exit(1); });
}
