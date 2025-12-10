const fs = require('fs');
const path = require('path');
const root = path.join(process.cwd(), 'src', 'locales');
const en = JSON.parse(fs.readFileSync(path.join(root, 'en.json'), 'utf8'));
const de = JSON.parse(fs.readFileSync(path.join(root, 'de.json'), 'utf8'));
function merge(enObj, deObj) {
  if (typeof enObj !== 'object' || enObj === null) return deObj !== undefined ? deObj : enObj;
  const out = Array.isArray(enObj) ? [] : {};
  for (const k of Object.keys(enObj)) {
    const ev = enObj[k];
    const dv = deObj && Object.prototype.hasOwnProperty.call(deObj, k) ? deObj[k] : undefined;
    if (typeof ev === 'object' && ev !== null && !Array.isArray(ev)) {
      out[k] = merge(ev, dv || {});
    } else {
      out[k] = dv !== undefined ? dv : ev;
    }
  }
  if (deObj && typeof deObj === 'object') {
    for (const k of Object.keys(deObj)) {
      if (!Object.prototype.hasOwnProperty.call(out, k)) out[k] = deObj[k];
    }
  }
  return out;
}
const merged = merge(en, de);
fs.writeFileSync(path.join(root, 'de.merged.json'), JSON.stringify(merged, null, 2), 'utf8');
process.stdout.write('Wrote ' + path.join(root, 'de.merged.json') + '\n');
