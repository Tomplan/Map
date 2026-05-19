#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import ExcelJS from 'exceljs';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');

dotenv.config({ path: path.resolve(projectRoot, '.env') });
dotenv.config({ path: path.resolve(projectRoot, '.env.local'), override: true });

const DEFAULT_TIMEOUT_MS = 15000;
const DEFAULT_DELAY_MS = 250;
const DEFAULT_CANDIDATE_PATHS = [
  '/',
  '/nl',
  '/en',
  '/de',
  '/about',
  '/about-us',
  '/company',
  '/nl/over-ons',
  '/en/about',
  '/de/ueber-uns',
  '/de/uber-uns',
];
const MAX_TEXT_LENGTH = 320;
const MIN_TEXT_LENGTH = 40;
const TRANSLATION_TIMEOUT_MS = 12000;
const BOILERPLATE_PATTERNS = [
  /\bcookies?\b/i,
  /\bprivacy\b/i,
  /\btracking\b/i,
  /\bnewsletter\b/i,
  /\bjavascript\b/i,
  /\bterms?\b/i,
  /\bvoorwaarden\b/i,
  /\bdatenschutz\b/i,
  /\bimpressum\b/i,
  /\bsubscribe\b/i,
  /\bmeld(?: je)? aan\b/i,
  /\banmelden\b/i,
  /\baccept\b/i,
  /\bakkoord\b/i,
  /\bconsent\b/i,
  /\bread more\b/i,
  /\blees meer\b/i,
  /\bmehr erfahren\b/i,
];
const BUSINESS_SIGNAL_PATTERNS = [
  /\b(we|wij|wir)\s+(develop|build|design|make|produce|manufacture|supply|deliver|offer|speciali(?:s|z)e|helpen|ontwikkelen|bouwen|produceren|leveren|bieden|sind|entwickeln|produzieren|bieten)\b/i,
  /\b(company|business|manufacturer|supplier|distributor|provider|specialist|partner|platform|software|solutions?|products?|services?)\b/i,
  /\b(bedrijf|fabrikant|leverancier|distributeur|specialist|oplossingen|producten|diensten)\b/i,
  /\b(unternehmen|hersteller|lieferant|anbieter|spezialist|losungen|l\u00f6sungen|produkte|dienstleistungen)\b/i,
];
const LANGUAGE_HINT_WORDS = {
  nl: [' de ', ' het ', ' een ', ' wij ', ' onze ', ' met ', ' voor ', ' van ', ' op '],
  en: [' the ', ' and ', ' with ', ' for ', ' our ', ' we ', ' is ', ' are ', ' to '],
  de: [' der ', ' die ', ' das ', ' und ', ' wir ', ' unsere ', ' mit ', ' fur ', ' für '],
};
const translationCache = new Map();

function parseArgs(argv) {
  const options = {
    delayMs: DEFAULT_DELAY_MS,
    timeoutMs: DEFAULT_TIMEOUT_MS,
  };

  for (let index = 2; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--input') options.input = argv[++index];
    else if (arg === '--output') options.output = argv[++index];
    else if (arg === '--limit') options.limit = Number(argv[++index]);
    else if (arg === '--delay-ms') options.delayMs = Number(argv[++index]);
    else if (arg === '--timeout-ms') options.timeoutMs = Number(argv[++index]);
    else if (arg === '--help' || arg === '-h') options.help = true;
  }

  return options;
}

function printHelp() {
  process.stdout.write(`Usage:\n  node scripts/utils/export_company_text_review.mjs [--input companies.json] [--output out.xlsx] [--limit 25]\n\nOptions:\n  --input       JSON array with objects containing id, name, website\n  --output      Output XLSX path\n  --limit       Only process the first N companies\n  --delay-ms    Delay between website requests (default: ${DEFAULT_DELAY_MS})\n  --timeout-ms  Per-request timeout in ms (default: ${DEFAULT_TIMEOUT_MS})\n\nEnvironment fallback when --input is omitted:\n  SUPABASE_URL and one of SUPABASE_SERVICE_ROLE_KEY, SUPABASE_KEY, VITE_SUPABASE_ANON_KEY\n`);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeWhitespace(value) {
  return String(value || '')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function trimToBriefText(value) {
  const normalized = normalizeWhitespace(value);
  if (!normalized) return '';

  const sentences = normalized
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  const brief = sentences.slice(0, 2).join(' ').trim() || normalized;
  if (brief.length <= MAX_TEXT_LENGTH) return brief;

  const truncated = brief.slice(0, MAX_TEXT_LENGTH);
  const lastSpace = truncated.lastIndexOf(' ');
  return `${(lastSpace > 80 ? truncated.slice(0, lastSpace) : truncated).trim()}...`;
}

function escapeRegExp(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildCompanyNamePattern(companyName) {
  const normalizedName = normalizeWhitespace(companyName);
  if (!normalizedName) return null;

  const significantWords = normalizedName
    .split(/\s+/)
    .map((word) => word.replace(/[^\p{L}\p{N}-]/gu, ''))
    .filter((word) => word.length >= 4);

  if (significantWords.length === 0) return null;
  return new RegExp(`\\b(${significantWords.map(escapeRegExp).join('|')})\\b`, 'i');
}

function normalizeWebsite(website) {
  if (!website) return null;
  const trimmed = String(website).trim();
  if (!trimmed) return null;

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    return new URL(withProtocol).toString();
  } catch {
    return null;
  }
}

function langFromHtml($) {
  const htmlLang = normalizeWhitespace($('html').attr('lang') || '').toLowerCase();
  if (htmlLang.startsWith('nl')) return 'nl';
  if (htmlLang.startsWith('de')) return 'de';
  if (htmlLang.startsWith('en')) return 'en';
  return null;
}

function looksLikeBoilerplate(text) {
  return BOILERPLATE_PATTERNS.some((pattern) => pattern.test(text));
}

function scoreCandidate(text, sourceType, companyNamePattern) {
  let score = 0;

  if (sourceType === 'jsonld') score += 50;
  else if (sourceType === 'meta') score += 40;
  else if (sourceType === 'about-section') score += 30;
  else if (sourceType === 'main') score += 18;
  else if (sourceType === 'article') score += 12;

  if (text.length >= 90 && text.length <= 260) score += 18;
  else if (text.length > 260) score += 8;

  if (BUSINESS_SIGNAL_PATTERNS.some((pattern) => pattern.test(text))) score += 25;
  if (companyNamePattern && companyNamePattern.test(text)) score += 8;
  if (/[:,;|]/.test(text)) score -= 10;
  if ((text.match(/[A-Z]{2,}/g) || []).length >= 4) score -= 8;
  if (looksLikeBoilerplate(text)) score -= 80;

  return score;
}

function addCandidate(candidates, seenTexts, rawText, metadata, companyNamePattern) {
  const text = trimToBriefText(rawText);
  if (text.length < MIN_TEXT_LENGTH) return;
  if (looksLikeBoilerplate(text)) return;

  const dedupeKey = text.toLowerCase();
  if (seenTexts.has(dedupeKey)) return;
  seenTexts.add(dedupeKey);

  candidates.push({
    text,
    sourceType: metadata.sourceType,
    selector: metadata.selector || null,
    score: scoreCandidate(text, metadata.sourceType, companyNamePattern),
  });
}

function extractJsonLdDescriptions($) {
  const descriptions = [];

  $('script[type="application/ld+json"]').each((_, node) => {
    const raw = $(node).contents().text();
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw);
      const values = Array.isArray(parsed) ? parsed : [parsed];

      for (const value of values) {
        if (!value || typeof value !== 'object') continue;
        if (typeof value.description === 'string') descriptions.push(value.description);
        if (Array.isArray(value['@graph'])) {
          for (const item of value['@graph']) {
            if (item && typeof item.description === 'string') descriptions.push(item.description);
          }
        }
      }
    } catch {
      // Ignore malformed JSON-LD blocks.
    }
  });

  return descriptions;
}

function collectParagraphCandidates($, selectors, sourceType, candidates, seenTexts, companyNamePattern) {
  for (const selector of selectors) {
    const nodes = $(selector).toArray();
    for (const node of nodes) {
      addCandidate(
        candidates,
        seenTexts,
        $(node).text(),
        { sourceType, selector },
        companyNamePattern,
      );
    }
  }
}

export function extractDescription(html, companyName = '') {
  if (!html) return { text: '', pageLanguage: null, sourceType: null, selector: null, score: 0 };

  const $ = cheerio.load(html);
  const pageLanguage = langFromHtml($);
  const companyNamePattern = buildCompanyNamePattern(companyName);
  const candidates = [];
  const seenTexts = new Set();
  const metaSelectors = [
    'meta[name="description"]',
    'meta[property="og:description"]',
    'meta[name="twitter:description"]',
  ];

  for (const selector of metaSelectors) {
    addCandidate(
      candidates,
      seenTexts,
      $(selector).attr('content'),
      { sourceType: 'meta', selector },
      companyNamePattern,
    );
  }

  for (const description of extractJsonLdDescriptions($)) {
    addCandidate(
      candidates,
      seenTexts,
      description,
      { sourceType: 'jsonld', selector: 'script[type="application/ld+json"]' },
      companyNamePattern,
    );
  }

  collectParagraphCandidates($, [
    '[id*="about" i] p',
    '[class*="about" i] p',
    '[id*="mission" i] p',
    '[class*="mission" i] p',
    '[id*="company" i] p',
    '[class*="company" i] p',
    '[id*="over" i] p',
    '[class*="over" i] p',
    '[id*="uber" i] p',
    '[class*="uber" i] p',
  ], 'about-section', candidates, seenTexts, companyNamePattern);

  collectParagraphCandidates($, ['main p'], 'main', candidates, seenTexts, companyNamePattern);
  collectParagraphCandidates($, ['article p'], 'article', candidates, seenTexts, companyNamePattern);
  collectParagraphCandidates($, ['body p'], 'body', candidates, seenTexts, companyNamePattern);

  const best = candidates.sort((left, right) => right.score - left.score)[0];
  if (!best) return { text: '', pageLanguage, sourceType: null, selector: null, score: 0 };

  return {
    text: best.text,
    pageLanguage,
    sourceType: best.sourceType,
    selector: best.selector,
    score: best.score,
  };
}

async function fetchUrl(url, timeoutMs) {
  const signal = AbortSignal.timeout(timeoutMs);

  try {
    const response = await fetch(url, {
      redirect: 'follow',
      signal,
      headers: {
        'user-agent': 'Map company text review/1.0 (+https://github.com/Tomplan/Map)',
        accept: 'text/html,application/xhtml+xml',
      },
    });

    if (!response.ok) {
      return { ok: false, error: `HTTP ${response.status}` };
    }

    return {
      ok: true,
      finalUrl: response.url,
      html: await response.text(),
    };
  } catch (error) {
    return { ok: false, error: error?.message || String(error) };
  }
}

function languageHintFromUrl(url) {
  const lower = String(url || '').toLowerCase();
  if (/(^|\/)nl([\/_-]|$)|over-ons/.test(lower)) return 'nl';
  if (/(^|\/)de([\/_-]|$)|ueber-uns|uber-uns/.test(lower)) return 'de';
  if (/(^|\/)en([\/_-]|$)|about/.test(lower)) return 'en';
  return null;
}

function detectTextLanguage(text) {
  const padded = ` ${normalizeWhitespace(text).toLowerCase()} `;
  const scores = { nl: 0, en: 0, de: 0 };

  for (const [language, hints] of Object.entries(LANGUAGE_HINT_WORDS)) {
    for (const hint of hints) {
      if (padded.includes(hint)) scores[language] += 1;
    }
  }

  const ranked = Object.entries(scores).sort((left, right) => right[1] - left[1]);
  if (!ranked[0] || ranked[0][1] === 0) return null;
  if (ranked[1] && ranked[0][1] === ranked[1][1]) return null;
  return ranked[0][0];
}

async function translateText(text, sourceLanguage, targetLanguage) {
  const normalizedText = normalizeWhitespace(text);
  if (!normalizedText || sourceLanguage === targetLanguage) return normalizedText;

  const cacheKey = `${sourceLanguage}:${targetLanguage}:${normalizedText}`;
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey);
  }

  const url = new URL('https://translate.googleapis.com/translate_a/single');
  url.searchParams.set('client', 'gtx');
  url.searchParams.set('sl', sourceLanguage);
  url.searchParams.set('tl', targetLanguage);
  url.searchParams.set('dt', 't');
  url.searchParams.set('q', normalizedText);

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(TRANSLATION_TIMEOUT_MS),
      headers: {
        'user-agent': 'Map company text review/1.0 (+https://github.com/Tomplan/Map)',
      },
    });

    if (!response.ok) {
      translationCache.set(cacheKey, null);
      return null;
    }

    const payload = await response.json();
    const translated = Array.isArray(payload?.[0])
      ? payload[0]
          .map((part) => (Array.isArray(part) ? part[0] : ''))
          .join('')
          .trim()
      : '';

    const normalizedTranslation = trimToBriefText(translated);
    translationCache.set(cacheKey, normalizedTranslation || null);
    return normalizedTranslation || null;
  } catch {
    translationCache.set(cacheKey, null);
    return null;
  }
}

export function chooseBestTexts(candidates) {
  const chosen = { nl: null, en: null, de: null };

  for (const candidate of candidates) {
    if (!candidate.text) continue;
    const hintedLanguage = languageHintFromUrl(candidate.url);
    const language = candidate.pageLanguage || hintedLanguage || detectTextLanguage(candidate.text);
    if (language && !chosen[language]) {
      chosen[language] = { text: candidate.text, source: candidate.finalUrl || candidate.url };
    }
  }

  return chosen;
}

async function fillMissingTranslations(texts) {
  const completed = { ...texts };
  const dutchText = completed.nl?.text;
  if (!dutchText) return completed;

  for (const language of ['en', 'de']) {
    if (completed[language]?.text) continue;

    const translatedText = await translateText(dutchText, 'nl', language);
    if (!translatedText) continue;

    completed[language] = {
      text: translatedText,
      source: completed.nl?.source || 'translated-from-nl',
      derivedFrom: 'nl',
      generated: true,
    };
  }

  return completed;
}

async function probeCompanyWebsite(company, options) {
  const normalizedWebsite = normalizeWebsite(company?.website);
  if (!normalizedWebsite) {
    return { texts: { nl: null, en: null, de: null }, status: 'invalid-website' };
  }

  const seen = new Set();
  const candidates = [];
  let hadSuccess = false;

  for (const candidatePath of DEFAULT_CANDIDATE_PATHS) {
    const url = new URL(candidatePath, normalizedWebsite).toString();
    if (seen.has(url)) continue;
    seen.add(url);

    const response = await fetchUrl(url, options.timeoutMs);
    if (!response.ok) {
      await sleep(options.delayMs);
      continue;
    }

    hadSuccess = true;
    const extracted = extractDescription(response.html, company.name || '');
    candidates.push({
      url,
      finalUrl: response.finalUrl,
      text: extracted.text,
      pageLanguage: extracted.pageLanguage,
    });

    await sleep(options.delayMs);
  }

  return {
    texts: await fillMissingTranslations(chooseBestTexts(candidates)),
    status: hadSuccess ? 'ok' : 'unreachable',
  };
}

async function loadCompanies(options) {
  if (options.input) {
    const inputPath = path.resolve(options.input);
    const raw = fs.readFileSync(inputPath, 'utf8');
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) {
      throw new Error('Input JSON must be an array of companies');
    }
    return data;
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Missing Supabase credentials. Set SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY in .env, or use --input.',
    );
  }

  const client = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });

  const { data, error } = await client
    .from('companies')
    .select('id, name, website')
    .order('name', { ascending: true });

  if (error) {
    throw new Error(error.message || String(error));
  }

  return data || [];
}

async function writeWorkbook(rows, outputPath) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Company Text Review');

  worksheet.columns = [
    { header: 'ID', key: 'id', width: 10 },
    { header: 'Company Name', key: 'company', width: 32 },
    { header: 'Website', key: 'website', width: 38 },
    { header: 'Info (Nederlands)', key: 'nlText', width: 52 },
    { header: 'Info (English)', key: 'enText', width: 52 },
    { header: 'Info (Deutsch)', key: 'deText', width: 52 },
    { header: 'status', key: 'status', width: 16 },
  ];

  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).alignment = { vertical: 'middle' };
  worksheet.views = [{ state: 'frozen', ySplit: 1 }];
  worksheet.autoFilter = 'A1:G1';

  for (const row of rows) {
    worksheet.addRow(row);
  }

  worksheet.eachRow((row, rowNumber) => {
    row.alignment = {
      vertical: 'top',
      wrapText: rowNumber > 1,
    };
  });

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  await workbook.xlsx.writeFile(outputPath);
}

async function main() {
  const options = parseArgs(process.argv);
  if (options.help) {
    printHelp();
    return;
  }

  const companies = await loadCompanies(options);
  const limitedCompanies = Number.isFinite(options.limit)
    ? companies.slice(0, options.limit)
    : companies;

  process.stdout.write(`Processing ${limitedCompanies.length} companies\n`);

  const rows = [];
  for (const company of limitedCompanies) {
    const review = company.website
      ? await probeCompanyWebsite(company, options)
      : { texts: { nl: null, en: null, de: null }, status: 'no-website' };

    rows.push({
      id: company.id ?? '',
      company: company.name || '',
      website: company.website || '',
      nlText: review.texts.nl?.text || '',
      enText: review.texts.en?.text || '',
      deText: review.texts.de?.text || '',
      status: review.status,
    });

    process.stdout.write(`Processed ${company.id ?? '?'} ${company.name || 'Unknown'} [${review.status}]\n`);
  }

  const outputPath = path.resolve(
    options.output || path.join(__dirname, '..', '..', 'out', 'company_text_review.xlsx'),
  );
  await writeWorkbook(rows, outputPath);
  process.stdout.write(`Wrote ${outputPath}\n`);
}

const isCliEntrypoint = process.argv[1] && path.resolve(process.argv[1]) === __filename;

if (isCliEntrypoint) {
  main().catch((error) => {
    console.error(error?.message || error);
    process.exit(1);
  });
}