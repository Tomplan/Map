const fs = require('fs');
const content = fs.readFileSync('src/components/admin/EventSubscriptionsTab.jsx', 'utf8').split('\n');
const idx = content.findIndex(l => l.includes('onConfirm: async (selected) => {'));
for(let i=idx; i<idx+40; i++) console.log(i + ': ' + content[i]);
