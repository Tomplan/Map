const fs=require('fs');
const path=require('path');
const root=path.join(process.cwd(),'src','locales');
const en=JSON.parse(fs.readFileSync(path.join(root,'en.json'),'utf8'));
const de=JSON.parse(fs.readFileSync(path.join(root,'de.json'),'utf8'));
function flatten(o,pre=''){
  const out={};
  if(typeof o === 'object' && o !== null && !Array.isArray(o)){
    for(const k of Object.keys(o)){
      const p = pre? pre + '.' + k : k;
      if(typeof o[k] === 'object' && o[k] !== null && !Array.isArray(o[k])){
        Object.assign(out, flatten(o[k], p));
      } else {
        out[p] = o[k];
      }
    }
  }
  return out;
}
const enk=flatten(en);
const dek=flatten(de);
const allKeys = Object.keys(enk).sort();
const missingInDe = allKeys.filter(k=> !(k in dek));
const placeholders = allKeys.filter(k=> dek[k] === enk[k]);
console.log('EN keys:', allKeys.length);
console.log('DE keys (leaf count):', Object.keys(dek).length);
console.log('Missing in DE (count):', missingInDe.length);
console.log('Placeholders (de == en) count:', placeholders.length);
if(missingInDe.length>0){
  console.log('\n--- Missing keys (present in en.json but not in de.json) ---');
  missingInDe.forEach(k=>console.log(k));
}
if(placeholders.length>0){
  console.log('\n--- Placeholder keys (de value equals en value) ---');
  placeholders.slice(0,200).forEach(k=>console.log(k));
  if(placeholders.length>200) console.log('...plus',placeholders.length-200,'more');
}

// print a small sample of values for verification
console.log('\n--- Sample values ---');
['navigation.home','homePage.title','adminLogin.title','mapManagement.addMarker'].forEach(key=>{
  console.log(key+':', dek[key]);
});
