const fs = require('fs');
const en = JSON.parse(fs.readFileSync('src/locales/en.json'));
console.log(JSON.stringify(en.mapManagement, null, 2));
