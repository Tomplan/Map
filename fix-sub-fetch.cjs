const fs = require('fs');
const content = fs.readFileSync('src/components/admin/EventSubscriptionsTab.jsx', 'utf8');

const m = content.match(/const fetchData = async.*?};/s);
if (m) console.log(m[0].substring(0, 500));
else console.log('Not found');
