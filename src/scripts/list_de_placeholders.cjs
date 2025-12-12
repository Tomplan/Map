const fs = require('fs');
const path = require('path');
const root = path.join(process.cwd(), 'src', 'locales');
const en = JSON.parse(fs.readFileSync(path.join(root, 'en.json'), 'utf8'));
const de = JSON.parse(fs.readFileSync(path.join(root, 'de.json'), 'utf8'));
function flatten(o, pre = '') {
  const out = {};
  if (typeof o === 'object' && o !== null && !Array.isArray(o)) {
    for (const k of Object.keys(o)) {
      const p = pre ? pre + '.' + k : k;
      if (typeof o[k] === 'object' && o[k] !== null && !Array.isArray(o[k])) {
        Object.assign(out, flatten(o[k], p));
      } else {
        out[p] = o[k];
      }
    }
  }
  return out;
}
const enk = flatten(en);
const dek = flatten(de);
const allKeys = Object.keys(enk).sort();
const missingInDe = allKeys.filter((k) => !(k in dek));
const placeholders = allKeys.filter((k) => dek[k] === enk[k]);
process.stdout.write('EN keys: ' + allKeys.length + '\n');
process.stdout.write('DE keys (leaf count): ' + Object.keys(dek).length + '\n');
process.stdout.write('Missing in DE (count): ' + missingInDe.length + '\n');
process.stdout.write('Placeholders (de == en) count: ' + placeholders.length + '\n');
if (missingInDe.length > 0) {
  process.stdout.write('\n--- Missing keys (present in en.json but not in de.json) ---\n');
  missingInDe.forEach((k) => process.stdout.write(k + '\n'));
}
if (placeholders.length > 0) {
  process.stdout.write('\n--- Placeholder keys (de value equals en value) ---\n');
  placeholders.slice(0, 200).forEach((k) => process.stdout.write(k + '\n'));
  if (placeholders.length > 200)
    process.stdout.write('...plus ' + (placeholders.length - 200) + ' more\n');
}

// print a small sample of values for verification
process.stdout.write('\n--- Sample values ---\n');
['navigation.home', 'homePage.title', 'adminLogin.title', 'mapManagement.addMarker'].forEach(
  (key) => {
    process.stdout.write(key + ': ' + dek[key] + '\n');
  },
);
