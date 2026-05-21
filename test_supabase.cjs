const fs = require('fs');
const content = fs.readFileSync('src/components/admin/EventSubscriptionsTab.jsx', 'utf8');
const toggleCode = content.match(/const toggleArrivalStatus = async.*?};/s);
console.log(toggleCode ? toggleCode[0] : 'Not found');
