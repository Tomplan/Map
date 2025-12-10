/**
 * Auto-categorize companies by fetching and analyzing their websites
 * Run with: node scripts/auto-categorize-companies.js
 */

import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file
dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const adminEmail = process.env.VITE_ADMIN_EMAIL;
const adminPassword = process.env.VITE_ADMIN_PASSWORD;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    '❌ Missing Supabase credentials. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY',
  );
  process.exit(1);
}

if (!adminEmail || !adminPassword) {
  console.error(
    '❌ Missing admin credentials. Set VITE_ADMIN_EMAIL and VITE_ADMIN_PASSWORD in .env',
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Category definitions with keywords
const CATEGORY_PATTERNS = {
  'vehicles-dealers': {
    name: 'Voertuigen & Dealers',
    keywords: [
      'vehicle',
      'dealer',
      'auto',
      'car',
      '4x4',
      '4wd',
      'suv',
      'land rover',
      'toyota',
      'nissan',
      'jeep',
      'suzuki',
      'mitsubishi',
      'isuzu',
      'ford ranger',
      'mercedes',
      'import',
      'verkoop',
      'dealer',
    ],
  },
  'camping-trailers': {
    name: 'Kampeermiddelen & Trailers',
    keywords: [
      'camping',
      'caravan',
      'tent',
      'daktent',
      'roof tent',
      'rooftop',
      'kampeermiddel',
      'tenttrailer',
      'vouwwagen',
      'bivvy',
    ],
  },
  'trailers-towing': {
    name: 'Aanhangwagens & Uitrusting',
    keywords: [
      'trailer',
      'aanhang',
      'trekhaak',
      'towing',
      'hitch',
      'anhänger',
      'bagagewagen',
      'horse trailer',
    ],
  },
  'parts-accessories': {
    name: 'Onderdelen & Accessoires',
    keywords: [
      'parts',
      'accessoir',
      'accessory',
      'onderdeel',
      'uitrusting',
      'equipment',
      'tuning',
      'upgrade',
      'modification',
      'winch',
      'snorkel',
      'bumper',
      'suspension',
      'tire',
      'wheel',
      'light',
      'recovery',
      'roof rack',
      'awning',
    ],
  },
  'travel-tours': {
    name: 'Reisorganisaties & Tours',
    keywords: [
      'travel',
      'tour',
      'reis',
      'safari',
      'adventure',
      'expeditie',
      'expedition',
      'voyage',
      'trip',
      'journey',
      'destination',
    ],
  },
  accommodations: {
    name: 'Accommodaties',
    keywords: [
      'accommodat',
      'hotel',
      'resort',
      'lodge',
      'verblijf',
      'stay',
      'campsite',
      'glamping',
      'bed and breakfast',
      'b&b',
    ],
  },
  'clubs-communities': {
    name: 'Clubs & Gemeenschappen',
    keywords: [
      'club',
      'community',
      'vereniging',
      'owners',
      'group',
      'members',
      'forum',
      'society',
      'association',
      'fanclub',
    ],
  },
  'offroad-experiences': {
    name: 'Terrein & Offroad Ervaringen',
    keywords: [
      'offroad',
      'off-road',
      'terrain',
      'driving',
      'training',
      'course',
      'rijles',
      'experience',
      'event',
      'trial',
      'challenge',
    ],
  },
  'electronics-communication': {
    name: 'Elektronica & Communicatie',
    keywords: [
      'gps',
      'navigat',
      'radio',
      'communication',
      'electronic',
      'garmin',
      'tracker',
      'cb radio',
      'satellite',
      'phone',
    ],
  },
};

// Fetch website content with timeout
async function fetchWebsiteContent(url) {
  try {
    // Ensure URL has protocol
    if (!url.startsWith('http')) {
      url = 'https://' + url;
    }

    // fetching URL

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CategoryBot/1.0)',
      },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      // non-OK HTTP status returned
      return '';
    }

    const html = await response.text();

    // Extract text content (simple approach - remove HTML tags)
    const text = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .toLowerCase();

    // fetched content
    return text;
  } catch (error) {
    // fetch error
    return '';
  }
}

// Analyze text and determine categories
function analyzeContent(text, companyName, companyInfo) {
  const allText = (text + ' ' + companyName + ' ' + companyInfo).toLowerCase();
  const matchedCategories = [];

  for (const [slug, category] of Object.entries(CATEGORY_PATTERNS)) {
    let score = 0;

    for (const keyword of category.keywords) {
      const regex = new RegExp(
        '\\b' + keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b',
        'gi',
      );
      const matches = allText.match(regex);
      if (matches) {
        score += matches.length;
      }
    }

    if (score > 0) {
      matchedCategories.push({ slug, name: category.name, score });
    }
  }

  // Sort by score and return top matches (score >= 2 for relevance)
  return matchedCategories.filter((c) => c.score >= 2).sort((a, b) => b.score - a.score);
}

// Main function
async function main() {
  // Auto-categorization started

  // Authenticate as admin
  // Authenticating
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: adminEmail,
    password: adminPassword,
  });

  if (authError) {
    console.error('❌ Authentication failed:', authError.message);
    process.exit(1);
  }

  // authenticated

  // Get all categories
  const { data: categories, error: catError } = await supabase
    .from('categories')
    .select('id, slug');

  if (catError) {
    console.error('❌ Failed to fetch categories:', catError);
    process.exit(1);
  }

  const categoryMap = {};
  categories.forEach((cat) => {
    categoryMap[cat.slug] = cat.id;
  });

  // Get all companies (exclude organization profile)
  const { data: companies, error: compError } = await supabase
    .from('companies')
    .select('id, name, website, info')
    .neq('id', 1);

  if (compError) {
    console.error('❌ Failed to fetch companies:', compError);
    process.exit(1);
  }

  // companies loaded

  let processed = 0;
  let skipped = 0;

  for (const company of companies) {
    // processing company

    if (!company.website) {
      // no website - skipping
      skipped++;
      continue;
    }

    // Fetch website content
    const websiteText = await fetchWebsiteContent(company.website);

    // Analyze content
    const companyInfo = company.info || '';
    const matches = analyzeContent(websiteText, company.name, companyInfo);

    if (matches.length === 0) {
      // no category matches found
      // Assign "Other" category
      const otherId = categoryMap['other'];
      if (otherId) {
        const { error } = await supabase
          .from('company_categories')
          .insert({ company_id: company.id, category_id: otherId })
          .select();

        if (error && error.code !== '23505') {
          // Ignore duplicate key errors
          // failed to assign Other
        } else {
          // assigned Other
        }
      }
    } else {
      // matched categories

      for (const match of matches) {
        // matched category: ${match.name} (score: ${match.score})

        const categoryId = categoryMap[match.slug];
        if (categoryId) {
          const { error } = await supabase
            .from('company_categories')
            .insert({ company_id: company.id, category_id: categoryId })
            .select();

          if (error && error.code !== '23505') {
            // Ignore duplicate key errors
            // failed to assign: ${error.message}
          } else {
            // assigned
          }
        }
      }
    }

    processed++;

    // Small delay to avoid overwhelming servers
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  process.stdout.write('\nComplete! Processed: ' + processed + ', Skipped: ' + skipped + '\n');
}

main().catch(console.error);
