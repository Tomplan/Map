const fs = require('fs');
const content = fs.readFileSync('src/components/admin/EventSubscriptionsTab.jsx', 'utf8');
const newContent = content.replace(
  'fetchData(); // Refresh list to get latest',
  'reload(); // Refresh list to get latest',
);
fs.writeFileSync('src/components/admin/EventSubscriptionsTab.jsx', newContent);
console.log('Fixed undefined fetchData');
