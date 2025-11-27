const fs = require('fs');
const path = require('path');

const inFile = path.resolve('out', 'companies_found.json');
const outFile = path.resolve('out', 'company_descriptions_review.csv');

if (!fs.existsSync(inFile)) {
  console.error('Input file not found:', inFile);
  process.exit(1);
}

const raw = fs.readFileSync(inFile, 'utf8');
const arr = JSON.parse(raw);

function q(s) {
  if (!s) return '""';
  const t = String(s).replace(/"/g, '""');
  if (t.length > 200) return '"' + t.slice(0, 200) + '..."';
  return '"' + t + '"';
}

const header = ['id','name','website','nl_description','en_description','de_description'].map(x => '"' + x + '"').join(',');
const rows = [header];

for (const c of arr) {
  const id = c.id || '';
  const name = q(c.name);
  const website = q(c.website);
  const nl = q(c.picked && c.picked.nl && c.picked.nl.text ? c.picked.nl.text : '');
  const en = q(c.picked && c.picked.en && c.picked.en.text ? c.picked.en.text : '');
  const de = q(c.picked && c.picked.de && c.picked.de.text ? c.picked.de.text : '');
  rows.push([id, name, website, nl, en, de].join(','));
}

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, rows.join('\n'), 'utf8');
process.stdout.write('Wrote ' + outFile + ' rows=' + (rows.length - 1) + '\n');
