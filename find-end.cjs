const fs = require('fs');
const content = fs.readFileSync('src/components/admin/EventSubscriptionsTab.jsx', 'utf8').split('\n');
const idx = content.findIndex(l => l.includes('await revertSelectedLineItems'));
for(let i=idx-20; i<idx+5; i++) console.log(i + ': ' + content[i]);
