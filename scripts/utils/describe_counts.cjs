const fs = require('fs');
const p = 'out/companies_found.json';
if (!fs.existsSync(p)) {
  console.error('missing', p);
  process.exit(1);
}
const a = JSON.parse(fs.readFileSync(p, 'utf8'));
let counts = { total: a.length, nl: 0, en: 0, de: 0, missingWebsite: 0 };
for (const c of a) {
  if (!c.website) counts.missingWebsite++;
  if (c.picked && c.picked.nl && c.picked.nl.text) counts.nl++;
  if (c.picked && c.picked.en && c.picked.en.text) counts.en++;
  if (c.picked && c.picked.de && c.picked.de.text) counts.de++;
}
process.stdout.write(JSON.stringify(counts, null, 2) + '\n');
