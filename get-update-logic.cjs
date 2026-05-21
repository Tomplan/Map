const fs = require('fs');
const content = fs.readFileSync('src/components/admin/EventSubscriptionsTab.jsx', 'utf8');

const m = content.match(/const updateSubscription.*?}/s);
if (m) console.log(m[0]);

const r = content.match(/<tr.*?className.*?hover:bg-gray-50.*?>.*?<\/tr>/s);
if (r) console.log(r[0]);
